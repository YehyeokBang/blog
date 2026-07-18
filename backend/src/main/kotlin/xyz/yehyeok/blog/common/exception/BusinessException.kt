package xyz.yehyeok.blog.common.exception

abstract class BusinessException(
    val errorCode: ErrorCode,
    message: String,
) : RuntimeException(message)

class NotFoundException(
    message: String,
) : BusinessException(ErrorCode.NOT_FOUND, message)

class InvalidRequestException(
    message: String,
) : BusinessException(ErrorCode.INVALID_REQUEST, message)

class ForbiddenException(
    message: String,
) : BusinessException(ErrorCode.FORBIDDEN, message)
