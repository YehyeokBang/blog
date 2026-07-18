package xyz.yehyeok.blog.post.infra

import org.springframework.data.jpa.repository.JpaRepository
import xyz.yehyeok.blog.post.domain.Post

interface PostRepository : JpaRepository<Post, Long> {
    fun findBySlugAndActiveTrue(slug: String): Post?
}
