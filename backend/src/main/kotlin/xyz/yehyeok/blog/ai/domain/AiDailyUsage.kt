package xyz.yehyeok.blog.ai.domain

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.Table

@Entity
@Table(name = "ai_daily_usage")
class AiDailyUsage(
    @Id
    @Column(name = "usage_date", nullable = false)
    var usageDate: String,
    @Column(name = "usage_count", nullable = false)
    var usageCount: Int = 0,
)
