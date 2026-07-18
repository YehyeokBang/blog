package xyz.yehyeok.blog.comment.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import java.time.Instant

@Entity
class Comment(
    @Column(nullable = false)
    var postSlug: String,
    @Column(nullable = false)
    var authorName: String,
    @Column(nullable = false)
    var authorAvatar: String,
    @Column(nullable = false, length = 1000)
    var content: String,
) {
    init {
        require(postSlug.isNotBlank()) { "postSlug는 비어있을 수 없습니다" }
        require(authorName.isNotBlank()) { "authorName은 비어있을 수 없습니다" }
        require(authorAvatar.isNotBlank()) { "authorAvatar는 비어있을 수 없습니다" }
        require(content.isNotBlank()) { "content는 비어있을 수 없습니다" }
        require(content.length <= 1000) { "댓글은 1000자 이하여야 합니다" }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    @Column(nullable = false)
    var createdAt: Instant = Instant.now()
        protected set
}
