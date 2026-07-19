package xyz.yehyeok.blog.engagement.api.dto

data class EngagementResponse(
    val slug: String,
    val likeCount: Long,
    val commentCount: Long,
    val liked: Boolean,
)

data class EngagementMutationResponse(
    val slug: String,
    val likeCount: Long,
    val commentCount: Long,
    val liked: Boolean,
    val changed: Boolean,
)

data class EngagementPageResponse(
    val content: List<EngagementFeedItemResponse>,
    val page: Int,
    val size: Int,
    val totalElements: Long,
    val totalPages: Int,
    val last: Boolean,
)

data class EngagementFeedItemResponse(
    val slug: String,
    val likeCount: Long,
    val commentCount: Long,
)
