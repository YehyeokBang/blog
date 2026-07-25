package xyz.yehyeok.blog.ai.application

import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.ai.chat.messages.AssistantMessage
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.model.ChatResponse
import org.springframework.ai.chat.model.Generation
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.test.context.ActiveProfiles
import reactor.core.publisher.Flux
import xyz.yehyeok.blog.ai.infra.AiDailyUsageRepository
import xyz.yehyeok.blog.ai.infra.AiSummaryRepository
import xyz.yehyeok.blog.post.domain.Post
import xyz.yehyeok.blog.post.domain.PostManifestEntry
import xyz.yehyeok.blog.post.domain.PostManifestRegistry
import xyz.yehyeok.blog.post.infra.PostRepository
import java.time.Duration
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.CountDownLatch
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicInteger

@SpringBootTest
@ActiveProfiles("test")
@org.springframework.context.annotation.Import(AiSummaryServiceTestConfig::class)
class AiSummaryServiceIntegrationTest {
    @Autowired
    private lateinit var aiSummaryService: AiSummaryService

    @Autowired
    private lateinit var postRepository: PostRepository

    @Autowired
    private lateinit var postManifestRegistry: PostManifestRegistry

    @Autowired
    private lateinit var aiDailyUsageRepository: AiDailyUsageRepository

    @Autowired
    private lateinit var aiSummaryRepository: AiSummaryRepository

    @Autowired
    private lateinit var chatModel: ChatModel

    @BeforeEach
    fun setUp() {
        postRepository.deleteAll()
        aiSummaryRepository.deleteAll()
        // aiDailyUsageRepository uses JDBC, we can't delete directly via JPA
        // Let's rely on date uniqueness or just use a new date
    }

    @AfterEach
    fun tearDown() {
        postRepository.deleteAll()
        aiSummaryRepository.deleteAll()
    }

    @Test
    fun `마지막 quota를 두고 경합하는 동시 요청 중 하나만 성공하고 캐시는 Gemini를 호출하지 않는다`() {
        // given
        val threadCount = 10
        val manifestEntries =
            (0 until threadCount).map { i ->
                val s = "test-post-$i"
                postRepository.save(Post(slug = s, active = true))
                val entry =
                    PostManifestEntry(
                        slug = s,
                        contentHash = "hash-$i",
                        content = "Content $i",
                    )
                every { postManifestRegistry.get(s) } returns entry
            }

        val zoneId = ZoneId.of("Asia/Seoul")
        val todayStr = ZonedDateTime.now(zoneId).format(DateTimeFormatter.ISO_LOCAL_DATE)

        // consume all but 1 quota
        for (i in 1..499) {
            aiDailyUsageRepository.reserveQuota(todayStr, 500)
        }

        val responseFlux =
            Flux.just(
                ChatResponse(listOf(Generation(AssistantMessage("line1\n")))),
                ChatResponse(listOf(Generation(AssistantMessage("line2\n")))),
                ChatResponse(listOf(Generation(AssistantMessage("line3\n")))),
            )
        every { chatModel.stream(any<org.springframework.ai.chat.prompt.Prompt>()) } returns responseFlux

        val executor = Executors.newFixedThreadPool(threadCount)
        val latch = CountDownLatch(threadCount)
        val readyLatch = CountDownLatch(threadCount)

        val successfulRequests = AtomicInteger(0)
        val quotaErrors = AtomicInteger(0)

        // when
        for (i in 0 until threadCount) {
            executor.submit {
                val slug = "test-post-$i"
                readyLatch.countDown()
                readyLatch.await()
                try {
                    val stream = aiSummaryService.generateSummary(slug)
                    val result = stream?.collectList()?.block(Duration.ofSeconds(10))

                    if (result != null) {
                        val events = result.map { it.event() to it.data() }
                        if (events.any { it.first == "error" && it.second?.contains("QUOTA_EXCEEDED") == true }) {
                            quotaErrors.incrementAndGet()
                        } else if (events.any { it.first == "complete" }) {
                            successfulRequests.incrementAndGet()
                        }
                    }
                } finally {
                    latch.countDown()
                }
            }
        }

        latch.await()
        executor.shutdown()

        // then
        successfulRequests.get() shouldBe 1
        quotaErrors.get() shouldBe (threadCount - 1)
        verify(exactly = 1) { chatModel.stream(any<org.springframework.ai.chat.prompt.Prompt>()) }

        // Cache hit test - generate summary again for the successful one. We don't know which one succeeded,
        // but wait, we can just generate for a new one that we know has cache?
        // Actually, let's just assert that any successful one is cached.
        // We'll test cache hit in a separate test for simplicity, or we can just try all of them and one will be cache hit.
        var cacheHits = 0
        for (i in 0 until threadCount) {
            val slug = "test-post-$i"
            val stream = aiSummaryService.generateSummary(slug)
            val result = stream?.collectList()?.block(Duration.ofSeconds(5))
            if (result?.any { it.event() == "complete" } == true) {
                cacheHits++
            }
        }
        // Only the one that succeeded earlier should succeed now from cache
        // others will fail quota again
        cacheHits shouldBe 1

        // Ensure no additional Gemini calls were made for cache hit
        verify(exactly = 1) { chatModel.stream(any<org.springframework.ai.chat.prompt.Prompt>()) }
    }
}

@TestConfiguration
class AiSummaryServiceTestConfig {
    @Bean
    @Primary
    fun chatModel(): ChatModel = mockk(relaxed = true)

    @Bean
    @Primary
    fun postManifestRegistry(): PostManifestRegistry = mockk(relaxed = true)
}
