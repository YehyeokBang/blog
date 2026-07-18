package xyz.yehyeok.blog.common.exception

enum class ErrorCode(
    val status: Int,
) {
    NOT_FOUND(404),
    INVALID_REQUEST(400),
    FORBIDDEN(403),
    INTERNAL_ERROR(500),
}
