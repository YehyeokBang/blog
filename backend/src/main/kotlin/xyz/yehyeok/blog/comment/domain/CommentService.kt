package xyz.yehyeok.blog.comment.domain

import io.github.oshai.kotlinlogging.KotlinLogging
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.yehyeok.blog.comment.infra.CommentRepository
import xyz.yehyeok.blog.common.exception.NotFoundException
import xyz.yehyeok.blog.post.infra.PostRepository

private val logger = KotlinLogging.logger {}

@Service
class CommentService(
    private val commentRepository: CommentRepository,
    private val postRepository: PostRepository,
) {
    @Transactional(readOnly = true)
    fun getCommentsBySlug(postSlug: String): List<Comment> =
        commentRepository.findAllByPostSlugOrderByCreatedAtAsc(postSlug)

    @Transactional
    fun createComment(
        postSlug: String,
        authorName: String,
        authorAvatar: String,
        content: String,
    ): Comment {
        logger.debug { "댓글 생성 요청: postSlug=$postSlug" }
        postRepository.findBySlugAndActiveTrue(postSlug)
            ?: throw NotFoundException("활성 포스트 slug=$postSlug 를 찾을 수 없습니다")
        val comment =
            Comment(
                postSlug = postSlug,
                authorName = authorName,
                authorAvatar = authorAvatar,
                content = content,
            )
        val saved = commentRepository.save(comment)
        logger.debug { "댓글 저장 완료: id=${saved.id}" }
        return saved
    }
}
