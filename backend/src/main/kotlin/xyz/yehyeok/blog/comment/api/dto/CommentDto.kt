package xyz.yehyeok.blog.comment.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import java.time.Instant

data class CommentRequest(
    @field:NotBlank(message = "작성자 이름은 필수입니다")
    @field:Size(max = 50, message = "작성자 이름은 50자 이하여야 합니다")
    val authorName: String,
    @field:NotBlank
    @field:Pattern(
        regexp = "^https://api\\.dicebear\\.com/9\\.x/fun-emoji/svg\\?seed=[A-Za-z0-9]+$",
        message = "허용되지 않은 avatar입니다",
    )
    val authorAvatar: String,
    @field:NotBlank
    @field:Size(max = 1000, message = "댓글은 1000자 이하여야 합니다")
    val content: String,
)

data class CommentResponse(
    val id: Long,
    val authorName: String,
    val authorAvatar: String,
    val content: String,
    val createdAt: Instant,
)
