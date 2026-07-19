package xyz.yehyeok.blog.engagement.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.Table
import java.time.Instant

@Entity
@Table(name = "anonymous_visitor")
class AnonymousVisitor(
    @Column(name = "token_hash", nullable = false, unique = true, updatable = false)
    var tokenHash: String,
) {
    @Id
    @Column(columnDefinition = "INTEGER")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    @Column(name = "created_at", nullable = false, columnDefinition = "TEXT")
    var createdAt: Instant = Instant.now()
        protected set
}
