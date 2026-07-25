package xyz.yehyeok.blog.ai.application

import io.micrometer.core.instrument.MeterRegistry
import org.springframework.ai.chat.model.ChatModel
import org.springframework.ai.chat.prompt.Prompt
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.codec.ServerSentEvent
import org.springframework.stereotype.Service
import reactor.core.publisher.Flux
import xyz.yehyeok.blog.ai.domain.AiSummary
import xyz.yehyeok.blog.ai.infra.AiDailyUsageRepository
import xyz.yehyeok.blog.ai.infra.AiSummaryRepository
import xyz.yehyeok.blog.post.domain.PostManifestRegistry
import xyz.yehyeok.blog.post.infra.PostRepository
import java.time.Duration
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap

@Service
class AiSummaryService(
    private val postRepository: PostRepository,
    private val postManifestRegistry: PostManifestRegistry,
    private val chatModel: ChatModel,
    private val meterRegistry: MeterRegistry,
    private val aiSummaryRepository: AiSummaryRepository,
    private val aiDailyUsageRepository: AiDailyUsageRepository,
    @Value("\${app.ai.summary.model-id}") private val modelId: String,
    @Value("\${app.ai.summary.prompt-version}") private val promptVersion: String,
    @Value("\${app.ai.summary.generation-timeout:30s}") private val generationTimeout: Duration,
    @Value("\${app.ai.summary.heartbeat-interval:15s}") private val heartbeatInterval: Duration,
    @Value("\${app.ai.summary.daily-quota:500}") private val dailyQuota: Int,
    @Value("\${app.ai.summary.timezone:Asia/Seoul}") private val timezone: String,
) {
    private val activeGenerations =
        meterRegistry.gauge(
            "ai.summary.active.generations",
            java.util.concurrent.atomic
                .AtomicInteger(0),
        )!!

    // In-memory cache for fast lookups
    private val inMemoryCache = ConcurrentHashMap<String, String>()

    // Single-flight tracking
    private val inFlightRequests = ConcurrentHashMap<String, Flux<String>>()

    fun generateSummary(slug: String): Flux<ServerSentEvent<String>>? {
        val post = postRepository.findBySlugAndActiveTrue(slug)
        if (post == null) {
            return null
        }

        val manifestEntry = postManifestRegistry.get(slug) ?: return null

        val cacheKey = "$slug:${manifestEntry.contentHash}:$modelId:$promptVersion"
        val requestId = UUID.randomUUID().toString()

        // 1. Check in-memory cache
        val cachedText =
            inMemoryCache[cacheKey] ?: run {
                // 2. Check SQLite cache
                aiSummaryRepository
                    .findBySlugAndContentHashAndModelIdAndPromptVersion(
                        slug,
                        manifestEntry.contentHash,
                        modelId,
                        promptVersion,
                    )?.summary
                    ?.also {
                        inMemoryCache[cacheKey] = it
                    }
            }

        if (cachedText != null) {
            return emitCachedSummary(requestId, cachedText)
        }

        return Flux.defer {
            // Single-flight check
            val existingFlux = inFlightRequests[cacheKey]
            if (existingFlux != null) {
                return@defer streamFromFlux(requestId, existingFlux)
            }

            val newFlux =
                Flux
                    .defer {
                        val accumulator = StringBuilder()

                        // Reserve Quota
                        val zoneId = ZoneId.of(timezone)
                        val todayStr = ZonedDateTime.now(zoneId).format(DateTimeFormatter.ISO_LOCAL_DATE)
                        val usageCount = aiDailyUsageRepository.reserveQuota(todayStr, dailyQuota)
                        if (usageCount == null) {
                            return@defer Flux.error<String>(RuntimeException("QUOTA_EXCEEDED"))
                        }

                        val prompt =
                            Prompt(
                                "다음 마크다운 형식의 블로그 글을 분석하여 가장 중요한 핵심 내용 3가지를 요약해 주세요. 각 줄은 반드시 '• ' 기호로 시작해야 합니다.\n\n${manifestEntry.content}",
                            )

                        chatModel
                            .stream(prompt)
                            .subscribeOn(
                                reactor.core.scheduler.Schedulers
                                    .boundedElastic(),
                            ).map { response ->
                                response.result?.output?.text ?: ""
                            }.doOnNext { chunk ->
                                accumulator.append(chunk)
                            }.concatWith(
                                reactor.core.publisher.Mono.defer {
                                    val fullText = accumulator.toString()
                                    val lines = fullText.lines().filter { it.isNotBlank() }
                                    if (lines.size == 3) {
                                        // Save to SQLite cache and In-memory cache
                                        val summary =
                                            AiSummary(
                                                slug = slug,
                                                contentHash = manifestEntry.contentHash,
                                                modelId = modelId,
                                                promptVersion = promptVersion,
                                                summary = fullText,
                                                updatedAt = ZonedDateTime.now(zoneId).toString(),
                                            )
                                        aiSummaryRepository.save(summary)
                                        inMemoryCache[cacheKey] = fullText
                                        reactor.core.publisher.Mono
                                            .empty<String>()
                                    } else {
                                        reactor.core.publisher.Mono.error<String>(
                                            RuntimeException("VALIDATION_FAILED"),
                                        )
                                    }
                                },
                            ).doOnSubscribe { activeGenerations.incrementAndGet() }
                            .doFinally {
                                activeGenerations.decrementAndGet()
                                inFlightRequests.remove(cacheKey)
                            }
                    }.replay()
                    .refCount(1)

            val previousFlux = inFlightRequests.putIfAbsent(cacheKey, newFlux)
            val actualFlux = previousFlux ?: newFlux

            streamFromFlux(requestId, actualFlux)
        }
    }

    private fun emitCachedSummary(
        requestId: String,
        text: String,
    ): Flux<ServerSentEvent<String>> =
        Flux.defer {
            val chunks = text.chunked(10) // Simulate streaming
            val dataFlux =
                Flux
                    .fromIterable(chunks)
                    .delayElements(Duration.ofMillis(70))
                    .map { chunk ->
                        ServerSentEvent
                            .builder<String>()
                            .id(requestId)
                            .event("delta")
                            .data(chunk)
                            .build()
                    }

            dataFlux
                .mergeWith(
                    Flux
                        .interval(heartbeatInterval)
                        .map {
                            ServerSentEvent
                                .builder<String>()
                                .comment("heartbeat")
                                .build()
                        }.takeUntilOther(dataFlux.ignoreElements()),
                ).concatWith(
                    Flux.just(
                        ServerSentEvent
                            .builder<String>()
                            .id(requestId)
                            .event("complete")
                            .data("[DONE]")
                            .build(),
                    ),
                )
        }

    private fun streamFromFlux(
        requestId: String,
        flux: Flux<String>,
    ): Flux<ServerSentEvent<String>> {
        val dataFlux =
            flux
                .map { chunk ->
                    ServerSentEvent
                        .builder<String>()
                        .id(requestId)
                        .event("delta")
                        .data(chunk)
                        .build()
                }.share()

        val progressMessages =
            listOf(
                "서버에 묻어둔 문서를 꺼내는 중...",
                "AI가 글을 읽고 생각에 잠겼습니다...",
                "문맥을 이진수로 변환하여 이해하는 중...",
                "커피 한 잔 마시며 핵심을 요약하는 중...",
                "3줄 요약을 위해 3천 번 고민하는 중...",
                "거의 다 왔습니다...",
            )

        val progressFlux =
            Flux
                .interval(Duration.ofMillis(1200))
                .zipWithIterable(progressMessages)
                .map { it.t2 }
                .map { msg ->
                    ServerSentEvent
                        .builder<String>()
                        .id(requestId)
                        .event("progress")
                        .data(msg)
                        .build()
                }.takeUntilOther(dataFlux.ignoreElements())

        return progressFlux
            .mergeWith(dataFlux)
            .mergeWith(
                Flux
                    .interval(heartbeatInterval)
                    .map {
                        ServerSentEvent
                            .builder<String>()
                            .comment("heartbeat")
                            .build()
                    }.takeUntilOther(dataFlux.ignoreElements()),
            ).concatWith(
                Flux.just(
                    ServerSentEvent
                        .builder<String>()
                        .id(requestId)
                        .event("complete")
                        .data("[DONE]")
                        .build(),
                ),
            ).timeout(generationTimeout)
            .onErrorResume { error ->
                error.printStackTrace()
                val errorMessage = error.message?.replace("\"", "\\\"") ?: "Unknown upstream error"
                val errorCode =
                    when {
                        errorMessage.contains("QUOTA_EXCEEDED") -> "QUOTA_EXCEEDED"
                        errorMessage.contains("VALIDATION_FAILED") -> "VALIDATION_FAILED"
                        else -> "GENERATION_FAILED"
                    }
                val actualMessage =
                    if (errorCode == "QUOTA_EXCEEDED") {
                        "Daily quota limit reached."
                    } else if (errorCode == "VALIDATION_FAILED") {
                        "Generated summary must have exactly 3 non-empty lines."
                    } else {
                        errorMessage
                    }
                val errorData = "{\"code\":\"$errorCode\", \"message\":\"$actualMessage\"}"
                Flux.just(
                    ServerSentEvent
                        .builder<String>()
                        .id(requestId)
                        .event("error")
                        .data(errorData)
                        .build(),
                )
            }
    }
}
