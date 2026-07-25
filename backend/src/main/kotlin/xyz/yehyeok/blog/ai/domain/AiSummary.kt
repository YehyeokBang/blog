package xyz.yehyeok.blog.ai.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "ai_summary")
class AiSummary(
    @Id
    @Column(name = "slug", nullable = false)
    var slug: String,
    @Column(name = "content_hash", nullable = false)
    var contentHash: String,
    @Column(name = "model_id", nullable = false)
    var modelId: String,
    @Column(name = "prompt_version", nullable = false)
    var promptVersion: String,
    @Column(name = "summary", nullable = false)
    var summary: String,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: String,
)
