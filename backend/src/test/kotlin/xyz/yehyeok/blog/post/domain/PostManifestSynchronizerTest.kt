package xyz.yehyeok.blog.post.domain

import io.kotest.matchers.shouldBe
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Test
import xyz.yehyeok.blog.post.infra.PostRepository

class PostManifestSynchronizerTest {
    private val postRepository = mockk<PostRepository>()
    private val synchronizer = PostManifestSynchronizer(postRepository)

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
        synchronizer.sync(sortedSetOf("becomes-active", "new-post", "still-active"))

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
