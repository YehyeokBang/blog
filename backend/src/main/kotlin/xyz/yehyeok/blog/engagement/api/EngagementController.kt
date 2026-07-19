package xyz.yehyeok.blog.engagement.api

import jakarta.servlet.http.HttpServletRequest
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpHeaders
import org.springframework.http.ResponseCookie
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import xyz.yehyeok.blog.common.exception.ForbiddenException
import xyz.yehyeok.blog.common.exception.InvalidRequestException
import xyz.yehyeok.blog.engagement.api.dto.EngagementMutationResponse
import xyz.yehyeok.blog.engagement.api.dto.EngagementPageResponse
import xyz.yehyeok.blog.engagement.api.dto.EngagementResponse
import xyz.yehyeok.blog.engagement.domain.EngagementService
import java.security.MessageDigest
import java.util.UUID

private const val ANONYMOUS_COOKIE = "blog_anonymous_id"

@RestController
class EngagementController(
    private val engagementService: EngagementService,
    @Value("\${app.engagement.allowed-origins}") allowedOrigins: String,
    @Value("\${app.engagement.cookie-secure}") private val cookieSecure: Boolean,
) {
    private val allowedOrigins =
        allowedOrigins
            .split(',')
            .map(String::trim)
            .filter(String::isNotEmpty)
            .toSet()

    @GetMapping("/api/post-engagements")
    fun getPage(
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int,
    ): EngagementPageResponse {
        if (page < 0 || size !in 1..100) throw InvalidRequestException("page와 size 값이 유효하지 않습니다")
        return engagementService.getPage(page, size).toResponse()
    }

    @GetMapping("/api/posts/{slug}/engagement")
    fun getDetail(
        @PathVariable slug: String,
        request: HttpServletRequest,
    ): EngagementResponse = engagementService.getDetail(validateSlug(slug), tokenHash(request)).toResponse()

    @PutMapping("/api/posts/{slug}/like")
    fun like(
        @PathVariable slug: String,
        request: HttpServletRequest,
    ): ResponseEntity<EngagementMutationResponse> {
        validateOrigin(request)
        val existingToken = cookieToken(request)
        val token = existingToken ?: UUID.randomUUID().toString()
        val response = engagementService.like(validateSlug(slug), hash(token)).toResponse()
        return if (existingToken == null) {
            ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, responseCookie(token).toString()).body(response)
        } else {
            ResponseEntity.ok(response)
        }
    }

    @DeleteMapping("/api/posts/{slug}/like")
    fun unlike(
        @PathVariable slug: String,
        request: HttpServletRequest,
    ): EngagementMutationResponse {
        validateOrigin(request)
        return engagementService.unlike(validateSlug(slug), tokenHash(request)).toResponse()
    }

    private fun validateOrigin(request: HttpServletRequest) {
        if (request.getHeader(HttpHeaders.ORIGIN) !in allowedOrigins) {
            throw ForbiddenException("허용되지 않은 origin입니다")
        }
    }

    private fun validateSlug(slug: String): String {
        if (!SLUG_PATTERN.matches(slug)) throw InvalidRequestException("slug 형식이 유효하지 않습니다")
        return slug
    }

    private fun cookieToken(request: HttpServletRequest): String? =
        request.cookies
            ?.firstOrNull { it.name == ANONYMOUS_COOKIE }
            ?.value
            ?.takeIf(String::isNotBlank)

    private fun tokenHash(request: HttpServletRequest): String? = cookieToken(request)?.let(::hash)

    private fun responseCookie(token: String): ResponseCookie =
        ResponseCookie
            .from(ANONYMOUS_COOKIE, token)
            .httpOnly(true)
            .secure(cookieSecure)
            .sameSite("Lax")
            .path("/api")
            .maxAge(ANONYMOUS_COOKIE_MAX_AGE_SECONDS)
            .build()

    private fun hash(token: String): String =
        MessageDigest
            .getInstance("SHA-256")
            .digest(token.toByteArray())
            .joinToString("") { byte -> "%02x".format(byte) }

    private companion object {
        val SLUG_PATTERN = Regex("[a-z0-9]+(?:-[a-z0-9]+)*")
        const val ANONYMOUS_COOKIE_MAX_AGE_SECONDS = 31_536_000L
    }
}
