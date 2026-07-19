package xyz.yehyeok.blog.engagement.domain

import org.springframework.data.domain.PageRequest
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import xyz.yehyeok.blog.comment.infra.CommentRepository
import xyz.yehyeok.blog.common.exception.NotFoundException
import xyz.yehyeok.blog.engagement.infra.AnonymousVisitorRepository
import xyz.yehyeok.blog.engagement.infra.PostLikeRepository
import xyz.yehyeok.blog.post.domain.Post
import xyz.yehyeok.blog.post.infra.PostRepository

data class Engagement(
    val slug: String,
    val likeCount: Long,
    val commentCount: Long,
    val liked: Boolean,
)

data class EngagementMutation(
    val engagement: Engagement,
    val changed: Boolean,
)

data class EngagementPage(
    val content: List<Engagement>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val last: Boolean,
)

@Service
class EngagementService(
    private val postRepository: PostRepository,
    private val commentRepository: CommentRepository,
    private val anonymousVisitorRepository: AnonymousVisitorRepository,
    private val postLikeRepository: PostLikeRepository,
) {
    @Transactional(readOnly = true)
    fun getPage(
        page: Int,
        size: Int,
    ): EngagementPage {
        val posts = postRepository.findAllByActiveTrueOrderBySlugAsc(PageRequest.of(page, size))
        return EngagementPage(
            content = posts.content.map { post -> snapshot(post, null) },
            page = page,
            size = size,
            totalElements = posts.totalElements,
            totalPages = posts.totalPages,
            last = posts.isLast,
        )
    }

    @Transactional(readOnly = true)
    fun getDetail(
        slug: String,
        tokenHash: String?,
    ): Engagement = snapshot(findActivePost(slug), tokenHash)

    @Transactional
    fun like(
        slug: String,
        tokenHash: String,
    ): EngagementMutation {
        val post = findActivePost(slug)
        anonymousVisitorRepository.insertIfAbsent(tokenHash)
        val visitor =
            anonymousVisitorRepository.findByTokenHash(tokenHash)
                ?: throw IllegalStateException("저장된 anonymous visitor를 찾을 수 없습니다")
        val changed = postLikeRepository.insertIfAbsent(post.idOrThrow(), visitor.idOrThrow()) == 1
        return EngagementMutation(snapshot(post, tokenHash), changed)
    }

    @Transactional
    fun unlike(
        slug: String,
        tokenHash: String?,
    ): EngagementMutation {
        val post = findActivePost(slug)
        if (tokenHash == null) return EngagementMutation(snapshot(post, null), false)
        val visitor =
            anonymousVisitorRepository.findByTokenHash(tokenHash)
                ?: return EngagementMutation(snapshot(post, tokenHash), false)
        val changed = postLikeRepository.deleteByPostIdAndVisitorId(post.idOrThrow(), visitor.idOrThrow()) == 1
        return EngagementMutation(snapshot(post, tokenHash), changed)
    }

    private fun findActivePost(slug: String): Post =
        postRepository.findBySlugAndActiveTrue(slug)
            ?: throw NotFoundException("활성 포스트 slug=$slug 를 찾을 수 없습니다")

    private fun snapshot(
        post: Post,
        tokenHash: String?,
    ): Engagement {
        val postId = post.idOrThrow()
        val visitorId = tokenHash?.let(anonymousVisitorRepository::findByTokenHash)?.id
        return Engagement(
            slug = post.slug,
            likeCount = postLikeRepository.countByPostId(postId),
            commentCount = commentRepository.countByPostSlug(post.slug),
            liked = visitorId != null && postLikeRepository.existsByPostIdAndVisitorId(postId, visitorId),
        )
    }
}

private fun Post.idOrThrow(): Long = id ?: throw IllegalStateException("저장되지 않은 post입니다")

private fun AnonymousVisitor.idOrThrow(): Long = id ?: throw IllegalStateException("저장되지 않은 visitor입니다")
