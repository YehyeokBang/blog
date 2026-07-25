package xyz.yehyeok.blog.ai.presentation

import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.http.codec.ServerSentEvent
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import reactor.core.publisher.Flux
import xyz.yehyeok.blog.ai.application.AiSummaryService

@RestController
@RequestMapping("/api/posts")
class AiSummaryController(
    private val aiSummaryService: AiSummaryService,
) {
    @GetMapping("/{slug}/ai-summary", produces = [MediaType.TEXT_EVENT_STREAM_VALUE])
    fun streamAiSummary(
        @PathVariable slug: String,
    ): ResponseEntity<Flux<ServerSentEvent<String>>> {
        val stream =
            aiSummaryService.generateSummary(slug)
                ?: return ResponseEntity.notFound().build()

        return ResponseEntity
            .ok()
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-transform")
            .header("X-Accel-Buffering", "no")
            .body(stream)
    }
}
