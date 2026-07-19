package xyz.yehyeok.blog.comment.infra

import org.springframework.data.jpa.repository.JpaRepository
import xyz.yehyeok.blog.comment.domain.Comment

interface CommentRepository : JpaRepository<Comment, Long> {
    fun findAllByPostSlugOrderByCreatedAtAsc(postSlug: String): List<Comment>

    fun countByPostSlug(postSlug: String): Long
}
