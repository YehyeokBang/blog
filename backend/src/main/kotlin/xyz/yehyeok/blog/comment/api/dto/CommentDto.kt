package xyz.yehyeok.blog.comment.api.dto

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import java.time.Instant

data class CommentRequest(
    @field:NotBlank(message = "작성자 이름은 필수입니다")
    val authorName: String,
    @field:NotBlank
    @field:Size(max = 200)
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
