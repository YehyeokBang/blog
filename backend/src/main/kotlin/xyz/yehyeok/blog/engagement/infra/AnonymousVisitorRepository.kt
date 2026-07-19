package xyz.yehyeok.blog.engagement.infra

import org.springframework.data.jpa.repository.JpaRepository
import xyz.yehyeok.blog.engagement.domain.AnonymousVisitor

interface AnonymousVisitorRepository : JpaRepository<AnonymousVisitor, Long> {
    fun findByTokenHash(tokenHash: String): AnonymousVisitor?
}
