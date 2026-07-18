package xyz.yehyeok.blog.common.exception

import io.github.oshai.kotlinlogging.KotlinLogging
import jakarta.servlet.http.HttpServletRequest
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

private val logger = KotlinLogging.logger {}

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        e: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ProblemDetail> {
        logger.warn { "BusinessException: ${e.message}" }
        val detail =
            ProblemDetail.forStatusAndDetail(
                HttpStatus.valueOf(e.errorCode.status),
                e.message ?: "오류가 발생했습니다",
            )
        detail.setProperty("code", e.errorCode.name)
        return ResponseEntity.status(e.errorCode.status).body(detail)
    }

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(e: MethodArgumentNotValidException): ResponseEntity<ProblemDetail> {
        val detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "입력값이 유효하지 않습니다")
        detail.setProperty("code", ErrorCode.INVALID_REQUEST.name)
        detail.setProperty("fields", e.bindingResult.fieldErrors.map { "${it.field}: ${it.defaultMessage}" })
        return ResponseEntity.badRequest().body(detail)
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(e: IllegalArgumentException): ResponseEntity<ProblemDetail> {
        logger.warn { "IllegalArgumentException: ${e.message}" }
        val detail = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, e.message ?: "잘못된 요청입니다")
        detail.setProperty("code", ErrorCode.INVALID_REQUEST.name)
        return ResponseEntity.badRequest().body(detail)
    }
}
