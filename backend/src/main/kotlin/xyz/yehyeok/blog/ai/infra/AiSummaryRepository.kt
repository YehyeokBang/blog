package xyz.yehyeok.blog.ai.infra

import org.springframework.data.jpa.repository.JpaRepository
import xyz.yehyeok.blog.ai.domain.AiSummary

interface AiSummaryRepository : JpaRepository<AiSummary, String> {
    fun findBySlugAndContentHashAndModelIdAndPromptVersion(
        slug: String,
        contentHash: String,
        modelId: String,
        promptVersion: String,
    ): AiSummary?
}
