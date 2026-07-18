package xyz.yehyeok.blog.comment.api

import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import xyz.yehyeok.blog.comment.api.dto.CommentRequest
import xyz.yehyeok.blog.comment.api.dto.CommentResponse
import xyz.yehyeok.blog.comment.domain.CommentService
import java.net.URI

@RestController
@RequestMapping("/api/posts/{slug}/comments")
class CommentController(
    private val commentService: CommentService,
) {
    @GetMapping
    fun getComments(
        @PathVariable slug: String,
    ): ResponseEntity<List<CommentResponse>> {
        val comments = commentService.getCommentsBySlug(slug).map { it.toResponse() }
        return ResponseEntity.ok(comments)
    }

    @PostMapping
    fun createComment(
        @PathVariable slug: String,
        @Valid @RequestBody request: CommentRequest,
    ): ResponseEntity<CommentResponse> {
        val saved =
            commentService.createComment(
                postSlug = slug,
                authorName = request.authorName,
                authorAvatar = request.authorAvatar,
                content = request.content,
            )
        return ResponseEntity
            .created(URI.create("/api/posts/$slug/comments/${saved.id}"))
            .body(saved.toResponse())
    }
}
