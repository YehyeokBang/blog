package xyz.yehyeok.blog.ai.infra

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate
import org.springframework.stereotype.Repository

@Repository
class AiDailyUsageRepository(
    private val jdbcTemplate: NamedParameterJdbcTemplate,
) {
    fun reserveQuota(
        date: String,
        limit: Int,
    ): Int? {
        val sql =
            """
            INSERT INTO ai_daily_usage (usage_date, usage_count)
            VALUES (:date, 1)
            ON CONFLICT(usage_date) DO UPDATE SET
                usage_count = usage_count + 1
            WHERE usage_count < :limit
            RETURNING usage_count
            """.trimIndent()

        val params =
            MapSqlParameterSource()
                .addValue("date", date)
                .addValue("limit", limit)

        return jdbcTemplate
            .query(sql, params) { rs, _ ->
                rs.getInt("usage_count")
            }.firstOrNull()
    }
}
