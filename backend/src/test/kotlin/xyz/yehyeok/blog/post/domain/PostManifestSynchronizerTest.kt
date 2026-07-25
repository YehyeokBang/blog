package xyz.yehyeok.blog.post.domain

import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Test
import xyz.yehyeok.blog.ai.infra.AiSummaryRepository
import xyz.yehyeok.blog.post.infra.PostRepository

class PostManifestSynchronizerTest {
    private val postRepository = mockk<PostRepository>(relaxed = true)
    private val aiSummaryRepository = mockk<AiSummaryRepository>(relaxed = true)
    private val synchronizer = PostManifestSynchronizer(postRepository, aiSummaryRepository)

    @Test
    fun `manifest slug는 active로 만들고 사라진 slug는 inactive로 만든다`() {
        // given
        val existingActive = Post("still-active")
        val existingInactive = Post("becomes-active", active = false)
        val removedPost = Post("removed-post")
        val savedPosts = slot<List<Post>>()
        every { postRepository.findAll() } returns listOf(existingActive, existingInactive, removedPost)
        every { postRepository.saveAll(capture(savedPosts)) } answers { savedPosts.captured }

        // when
        synchronizer.sync(
            listOf(
                PostManifestEntry("becomes-active", "hash1", "c1"),
                PostManifestEntry("new-post", "hash2", "c2"),
                PostManifestEntry("still-active", "hash3", "c3"),
            ),
        )

        // then
        savedPosts.captured.associateBy { it.slug }.mapValues { it.value.active } shouldBe
            mapOf(
                "still-active" to true,
                "becomes-active" to true,
                "removed-post" to false,
                "new-post" to true,
            )
        verify(exactly = 1) { postRepository.saveAll(any<Iterable<Post>>()) }
    }
}
