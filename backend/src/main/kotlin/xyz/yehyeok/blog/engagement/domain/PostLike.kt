package xyz.yehyeok.blog.engagement.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import java.time.Instant

@Entity
@Table(
    name = "post_like",
    uniqueConstraints = [UniqueConstraint(name = "uk_post_like_post_visitor", columnNames = ["post_id", "visitor_id"])],
)
class PostLike(
    @Column(name = "post_id", nullable = false, updatable = false)
    var postId: Long,
    @Column(name = "visitor_id", nullable = false, updatable = false)
    var visitorId: Long,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    @Column(name = "created_at", nullable = false)
    var createdAt: Instant = Instant.now()
        protected set
}
