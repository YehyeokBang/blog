package xyz.yehyeok.blog.comment.domain

import io.kotest.assertions.throwables.shouldThrow
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.jupiter.api.Test
import xyz.yehyeok.blog.comment.infra.CommentRepository
import xyz.yehyeok.blog.common.exception.NotFoundException
import xyz.yehyeok.blog.post.infra.PostRepository

class CommentServiceTest {
    private val commentRepository = mockk<CommentRepository>(relaxed = true)
    private val postRepository = mockk<PostRepository>(relaxed = true)
    private val commentService = CommentService(commentRepository, postRepository)

    @Test
    fun `inactive 또는 없는 slug에는 댓글을 저장하지 않는다`() {
        // given
        every { postRepository.findBySlugAndActiveTrue("inactive-post") } returns null

        // when & then
        shouldThrow<NotFoundException> {
            commentService.createComment(
                postSlug = "inactive-post",
                authorName = "활기찬고양이",
                authorAvatar = "https://example.com/avatar.svg",
                content = "댓글입니다",
            )
        }
        verify(exactly = 0) { commentRepository.save(any()) }
    }
}
