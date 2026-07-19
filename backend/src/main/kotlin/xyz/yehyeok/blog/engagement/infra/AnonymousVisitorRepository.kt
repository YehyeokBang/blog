package xyz.yehyeok.blog.engagement.infra

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import xyz.yehyeok.blog.engagement.domain.AnonymousVisitor

interface AnonymousVisitorRepository : JpaRepository<AnonymousVisitor, Long> {
    fun findByTokenHash(tokenHash: String): AnonymousVisitor?

    @Modifying(flushAutomatically = true)
    @Query(
        value = """
            INSERT OR IGNORE INTO anonymous_visitor(token_hash, created_at)
            VALUES (:tokenHash, CURRENT_TIMESTAMP)
            """,
        nativeQuery = true,
    )
    fun insertIfAbsent(
        @Param("tokenHash") tokenHash: String,
    ): Int
}
