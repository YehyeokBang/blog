package xyz.yehyeok.blog.comment.api

import xyz.yehyeok.blog.comment.api.dto.CommentResponse
import xyz.yehyeok.blog.comment.domain.Comment

fun Comment.toResponse(): CommentResponse =
    CommentResponse(
        id = this.id ?: throw IllegalStateException("저장되지 않은 댓글입니다"),
        authorName = this.authorName,
        authorAvatar = this.authorAvatar,
        content = this.content,
        createdAt = this.createdAt,
    )
