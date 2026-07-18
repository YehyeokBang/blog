# 백엔드 도메인·API 규칙

- **적용 범위**: `backend/` 하위 Kotlin 코드의 도메인 모델과 HTTP API 구현
- **상위 진입점**: [백엔드 컨벤션](README.md)

구현 전 [백엔드 컨벤션](README.md)의 역할별 읽기 순서를 확인한다. 이 문서는 기존 컨벤션의 2–10절과 13절을 역할 기준으로 옮긴 것이다.

---

## 2. 네이밍

### 규칙

- **MUST** Kotlin 공식 코딩 컨벤션을 따른다.
- **MUST** 테스트 메서드는 **백틱 한글**로 작성한다.
- **MUST** 클래스명: `PascalCase`, 함수/변수: `camelCase`, 상수: `SCREAMING_SNAKE_CASE`, 패키지: `lowercase`

### 근거

백틱 한글 테스트는 테스트 목록 자체가 기능 명세서 역할을 한다.
AI 에이전트가 한글 테스트 이름을 읽으면 비즈니스 의도를 정확히 파악할 수 있다.
순수 Kotlin 프로젝트이므로 Java 호환성 문제가 없다.

### 좋은 예 / 나쁜 예

```kotlin
// ✅ 클래스/함수/변수 네이밍
class CommentService
fun getCommentsBySlug(postSlug: String): List<CommentResponse>
val authorName: String
const val MAX_CONTENT_LENGTH = 1000

// ✅ 테스트 메서드 — 백틱 한글
@Test
fun `존재하지 않는 슬러그로 조회하면 빈 리스트를 반환한다`() { ... }

@Test
fun `존재하지 않는 포스트 슬러그로 댓글을 작성하면 NotFoundException이 발생한다`() { ... }

// ❌ 테스트 메서드 — 영어 camelCase (의도 파악 어려움)
@Test
fun shouldReturnEmptyListWhenSlugNotFound() { ... }
```

---

## 3. 패키지 구조 & 아키텍처

### 규칙

- **MUST** 패키지는 **by-feature** 방식으로 구성한다. (by-layer 금지)
- **MUST** 각 feature 내부는 `api/`, `domain/`, `infra/` 3계층으로 나눈다.
- **MUST** 횡단 관심사(예외, 공통 응답 등)는 `common/` 패키지에 둔다.
- **SHOULD** UseCase 클래스는 단일 Service가 **2개 이상의 도메인 서비스를 조합**할 때만 도입한다.

### 근거

by-feature는 기능 단위로 응집도가 높아 탐색이 빠르고, 나중에 멀티모듈로 분리하기 쉽다.
내부 레이어 분리는 현재 파일 수가 적어도 도메인 경계를 고민하는 훈련이 된다.
UseCase는 현재 댓글/조회수/검색 수준의 로직에서는 Service와 1:1 중복이 되어 오버엔지니어링이다.

### 패키지 구조 예시

```
xyz.yehyeok.blog/
├── BlogBackendApplication.kt
│
├── comment/                        # feature: 댓글
│   ├── api/
│   │   ├── CommentController.kt    # HTTP 요청/응답 전담
│   │   ├── CommentMapper.kt        # Entity → DTO 확장 함수
│   │   └── dto/
│   │       └── CommentDto.kt       # Request/Response data class
│   ├── domain/
│   │   ├── Comment.kt              # JPA Entity
│   │   └── CommentService.kt       # 비즈니스 로직
│   └── infra/
│       └── CommentRepository.kt    # JPA Repository
│
├── config/                         # 횡단 설정
│   └── WebConfig.kt
│
└── common/                         # 공통 유틸
    └── exception/
        ├── BusinessException.kt
        ├── ErrorCode.kt
        └── GlobalExceptionHandler.kt
```

### 계층 간 의존 방향

```
api → domain → infra
```

- `api`(Controller/DTO/Mapper)는 `domain`을 참조할 수 있다.
- `domain`(Entity/Service)은 `api`를 참조하지 않는다.
- `infra`는 feature의 Spring Data JPA Repository를 둔다.

### UseCase 도입 트리거

```kotlin
// ❌ 이 수준에서는 UseCase 불필요 (Service가 통과 클래스가 됨)
class CreateCommentUseCase {
    fun execute(...) = commentRepository.save(comment)
}

// ✅ 이 수준부터 UseCase 도입 검토
class CreateCommentUseCase {
    fun execute(...) {
        spamFilterService.validate(request.content)  // 도메인 서비스 1
        notificationService.notifyAuthor(postSlug)   // 도메인 서비스 2
        commentRepository.save(comment)
    }
}
```

---

## 4. Null 처리

### 규칙

- **MUST** `!!` (non-null assertion) 사용을 금지한다.
- **MUST** nullable 타입은 꼭 필요한 곳에만 사용하고, non-null로 설계 가능하면 non-null로 한다.
- **MUST** null 대신 의미있는 기본값, `?: throw`, `requireNotNull()`, `?.let { }` 을 사용한다.

### 근거

`!!`는 런타임 NPE를 유발하며, "확실히 null이 아님"을 판단하기 어려운 초급 단계에서 특히 위험하다.
Kotlin의 타입 시스템이 null 안전성을 보장하므로, `!!`는 그 이점을 포기하는 것과 같다.

### 좋은 예 / 나쁜 예

```kotlin
// ❌ non-null assertion 사용
val comment = commentRepository.findById(id)!!

// ✅ Elvis + throw
val comment = commentRepository.findById(id)
    ?: throw NotFoundException("댓글 id=$id 를 찾을 수 없습니다")

// ✅ requireNotNull
val content = requireNotNull(request.content) { "content는 필수입니다" }

// ✅ let으로 안전 처리
comment.parentId?.let { parentId ->
    validateParentExists(parentId)
}
```

---

## 5. JPA Entity 설계

### 규칙

- **MUST** Entity는 `data class`가 아닌 `class`로 선언한다.
- **MUST** ID 필드는 `var id: Long? = null`로 선언한다. (`Long = 0L` 금지)
- **MUST** 생성자 프로퍼티는 `public var`로 선언하되, **Entity 상태 변경은 의미 있는 메서드를 통해서만** 한다. 외부에서 프로퍼티 직접 대입 금지.
- **MUST** 날짜/시간은 UTC 기준 `Instant`를 사용한다. `LocalDateTime.now()` 금지.
- **MUST** `import jakarta.persistence.*` 와일드카드 import는 허용하지 않는다. 필요한 것만 명시적으로 import한다.

### 근거

`data class`의 자동 생성 `equals()`/`hashCode()`는 lazy 연관관계 로딩 시 N+1 및 StackOverflow를 유발할 수 있다.
`id: Long? = null`은 JPA의 "null = 새 엔티티, non-null = 기존 엔티티" 의미를 명시적으로 표현한다.
생성자 프로퍼티를 `public var`로 두되 직접 대입 대신 메서드로 변경을 강제하면, Hibernate 호환성과 캡슐화를 동시에 확보할 수 있다.
`LocalDateTime`은 시스템 타임존에 따라 값이 달라져 배포 환경에 따른 버그를 유발한다. `Instant`(UTC)는 항상 동일한 시점을 보장한다.

### 좋은 예 / 나쁜 예

```kotlin
// ✅ 올바른 Entity 설계
@Entity
class Comment(
    @Column(nullable = false)
    var postSlug: String,

    @Column(nullable = false)
    var authorName: String,

    @Column(nullable = false, length = 1000)
    var content: String,
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
        protected set

    @Column(nullable = false)
    var createdAt: Instant = Instant.now()
        protected set

    // ✅ 상태 변경은 의미 있는 메서드로
    fun updateContent(newContent: String) {
        require(newContent.isNotBlank()) { "content는 비어있을 수 없습니다" }
        this.content = newContent
    }
}

// 서비스 등에서 사용 시:
comment.updateContent("수정된 내용")         // ✅ 메서드 사용

// ❌ 나쁜 예
@Entity
data class Comment(                          // ❌ data class
    val id: Long = 0L,                       // ❌ val, 0L 기본값
    val content: String,                     // ❌ val
    val createdAt: LocalDateTime = LocalDateTime.now()  // ❌ LocalDateTime
)

// ❌ 외부에서 프로퍼티 직접 대입
comment.content = "수정된 내용"              // ❌ 메서드 없이 직접 대입
```

---

## 6. DTO 매핑 전략

### 규칙

- **MUST** Request/Response DTO는 `data class`로 선언한다.
- **MUST** DTO는 Entity를 참조하지 않는다. (DTO의 보조 생성자에서 Entity를 받는 것 금지)
- **MUST** Entity → DTO 변환은 **확장 함수**로 작성하고, `api/CommentMapper.kt` 또는 `api/dto/` 파일 하단에 위치시킨다. (`domain/`에 위치 금지 — domain이 api를 참조하게 됨)
- **MUST** DTO 파일은 `api/dto/` 하위에 위치한다.
- **MUST** DTO 날짜/시간 필드는 `Instant` 타입으로 두고, 직렬화는 Jackson 기본(ISO 8601)에 위임한다.

### 근거

DTO가 Entity를 알면 API 변경이 도메인에 영향을 주게 된다.
확장 함수를 `domain/`에 두면 domain이 api/dto 타입을 import하게 되어 의존 방향 원칙(3절)에 위배된다.
`api/` 계층에 매핑 함수를 두면 "api는 domain을 알 수 있다"는 단방향 의존 규칙을 지킨다.

### 좋은 예 / 나쁜 예

```kotlin
// api/dto/CommentDto.kt
data class CommentRequest(
    val authorName: String,
    val authorAvatar: String,
    val content: String,
)

data class CommentResponse(
    val id: Long,
    val authorName: String,
    val authorAvatar: String,
    val content: String,
    val createdAt: Instant,
)

// ❌ 나쁜 예 — DTO가 Entity를 알고 있음
data class CommentResponse(...) {
    constructor(comment: Comment) : this(...)  // Entity 직접 참조
}

// ✅ 좋은 예 — api/CommentMapper.kt (api 계층)
fun Comment.toResponse(): CommentResponse = CommentResponse(
    id = this.id ?: throw IllegalStateException("저장되지 않은 댓글입니다"),
    authorName = this.authorName,
    authorAvatar = this.authorAvatar,
    content = this.content,
    createdAt = this.createdAt,
)

// Service에서 사용
val saved = commentRepository.save(comment)
return saved.toResponse()
```

---

## 7. 예외 처리 & 에러 응답

### 규칙

- **MUST** 모든 비즈니스 예외는 `BusinessException`을 상속한다.
- **MUST** `@RestControllerAdvice`로 글로벌 예외 핸들러를 단일 위치에 둔다.
- **MUST** 에러 응답은 `ProblemDetail` (RFC 7807, Spring Boot 4 내장)을 사용한다.
- **MUST** `ProblemDetail`에 `detail.setProperty("code", e.errorCode.name)`으로 기계 판독용 에러 코드를 포함한다.
- **MUST** `GlobalExceptionHandler`에 `MethodArgumentNotValidException` 핸들러를 추가하여 Bean Validation 오류를 ProblemDetail로 변환한다.
- **MUST** 클라이언트에게 스택트레이스를 절대 노출하지 않는다.
- **SHOULD** 예외 메시지에는 어떤 값이 문제인지 포함한다. (예: `id=99`)

### 근거

`BusinessException` 계층은 국내 실무(카카오페이, 우아한형제들 등)에서 검증된 관용 패턴이다.
`ProblemDetail`은 RFC 7807 국제 표준으로 Spring Boot 4에 내장되어 있어 별도 구현이 필요 없다.
`"code"` 커스텀 프로퍼티는 프론트엔드가 에러 종류별로 분기 처리할 수 있게 해준다.

### 구조 및 코드 예시

```kotlin
// common/exception/BusinessException.kt
abstract class BusinessException(
    val errorCode: ErrorCode,
    message: String,
) : RuntimeException(message)

class NotFoundException(message: String) : BusinessException(ErrorCode.NOT_FOUND, message)
class InvalidRequestException(message: String) : BusinessException(ErrorCode.INVALID_REQUEST, message)
class ForbiddenException(message: String) : BusinessException(ErrorCode.FORBIDDEN, message)

// common/exception/ErrorCode.kt
enum class ErrorCode(val status: Int) {
    NOT_FOUND(404),
    INVALID_REQUEST(400),
    FORBIDDEN(403),
    INTERNAL_ERROR(500),
}

// common/exception/GlobalExceptionHandler.kt
private val logger = KotlinLogging.logger {}

@RestControllerAdvice
class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException::class)
    fun handleBusinessException(
        e: BusinessException,
        request: HttpServletRequest,
    ): ResponseEntity<ProblemDetail> {
        logger.warn { "BusinessException: ${e.message}" }
        val detail = ProblemDetail.forStatusAndDetail(
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

// Service에서 사용
val comment = commentRepository.findById(id)
    ?: throw NotFoundException("댓글 id=$id 를 찾을 수 없습니다")
```

---

## 8. 트랜잭션

### 규칙

- **MUST** 트랜잭션 경계는 **Service 계층**에 둔다. Controller 및 Repository에 `@Transactional` 금지.
- **MUST** 조회 전용 메서드는 `@Transactional(readOnly = true)`를 명시한다.
- **MUST** `@Modifying @Query`를 호출하는 Service 메서드는 `@Transactional`을 반드시 붙인다.

### 근거

트랜잭션이 Service에 집중되면 비즈니스 흐름의 원자성 경계가 명확해진다.
Controller에 `@Transactional`을 두면 HTTP 처리 시간 전체가 트랜잭션에 포함되어 커넥션을 낭비한다.
`readOnly = true`는 Hibernate의 dirty checking을 비활성화해 조회 성능을 높인다.

### 좋은 예 / 나쁜 예

```kotlin
// ✅ Service에 트랜잭션 경계
@Service
class CommentService(private val commentRepository: CommentRepository) {

    @Transactional(readOnly = true)
    fun getCommentsBySlug(postSlug: String): List<CommentResponse> {
        return commentRepository.findAllByPostSlugOrderByCreatedAtAsc(postSlug)
            .map { it.toResponse() }
    }

    @Transactional
    fun createComment(postSlug: String, request: CommentRequest): CommentResponse {
        val comment = Comment(postSlug = postSlug, authorName = request.authorName, ...)
        return commentRepository.save(comment).toResponse()
    }
}

// ✅ @Modifying을 호출하는 Service 메서드에 @Transactional 필수
@Transactional
fun incrementViewCount(slug: String) {
    viewRepository.incrementViewCount(slug)
}

// ❌ Controller에 @Transactional
@RestController
class CommentController {
    @Transactional   // ❌ Controller에 두지 않는다
    @PostMapping
    fun createComment(...) { ... }
}
```

---

## 9. 입력 검증

### 규칙

- **MUST** **형식 검증**(길이, 필수값, 포맷)은 Bean Validation(`@Valid` + `jakarta.validation`)으로 Controller에서 처리한다.
- **MUST** **비즈니스 검증**(존재 여부, 권한 등)은 Service에서 처리하고 `BusinessException`을 던진다.
- **MUST** `GlobalExceptionHandler`에 `MethodArgumentNotValidException` 핸들러를 포함한다. (7절 코드 참조)

### 근거

형식 검증을 Controller에서 처리하면 Service 코드가 단순해진다.
Bean Validation은 Spring Boot에 내장되어 있어 별도 의존성이 필요 없다.
검증 실패 시 일관된 ProblemDetail 응답을 보장하려면 글로벌 핸들러가 필수다.

### 좋은 예 / 나쁜 예

```kotlin
// ✅ DTO에 Bean Validation 어노테이션
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

// ✅ Controller에서 @Valid
@PostMapping
fun createComment(
    @PathVariable slug: String,
    @Valid @RequestBody request: CommentRequest,  // @Valid 필수
): ResponseEntity<CommentResponse> { ... }

// ✅ Service에서 비즈니스 검증
fun createComment(postSlug: String, request: CommentRequest): CommentResponse {
    postRepository.findBySlug(postSlug)
        ?: throw NotFoundException("포스트 slug=$postSlug 를 찾을 수 없습니다")
    ...
}

// ❌ Service에서 형식 검증 (Bean Validation이 해야 할 일)
fun createComment(postSlug: String, request: CommentRequest): CommentResponse {
    if (request.content.length > 1000) throw InvalidRequestException("1000자 초과")
    ...
}
```

---

## 10. 비동기 / 동시성

### 규칙

- **MUST** 현재는 **동기(blocking) 방식**을 유지한다. 코루틴, `@Async` 도입 금지.
- **MUST** 조회수 등 동시성이 중요한 카운터는 DB 원자적 업데이트로 처리한다.
- **MAY** Virtual Threads는 `spring.threads.virtual.enabled=true`를 명시해 활성화한 경우에만 사용한다.

### 근거

Java 25 + Spring Boot 4.1에서도 `spring.threads.virtual.enabled=true`를 설정해야 Virtual Threads가 활성화된다. 활성화 후에는 블로킹 I/O도 경량 처리된다.
코루틴은 WebFlux 전환 시 도입하는 것이 자연스럽고, WebMVC에서 억지로 도입하면 복잡도만 증가한다.

### 동시성 처리 예시 (조회수)

```kotlin
// ✅ DB 원자적 업데이트 — 동시성 안전
// Repository
@Modifying
@Query("UPDATE PostView v SET v.count = v.count + 1 WHERE v.postSlug = :slug")
fun incrementViewCount(@Param("slug") slug: String): Int

// Service — @Modifying 호출이므로 @Transactional 필수
@Transactional
fun incrementViewCount(slug: String) {
    viewRepository.incrementViewCount(slug)
}

// ❌ 애플리케이션 레벨 카운터 — 동시성 문제 (lost update)
val view = viewRepository.findBySlug(slug)
view.count += 1
viewRepository.save(view)
```

---

## 13. API 설계

### 규칙

- **MUST** URL은 소문자 케밥-케이스(`kebab-case`)를 사용한다.
- **MUST** 리소스는 복수형 명사를 사용한다. (예: `/comments`, `/posts`)
- **MUST** 에러 응답은 **ProblemDetail** (RFC 7807)을 사용한다.
- **MUST** 백엔드는 원문 그대로 저장한다. XSS 이스케이프는 렌더링 시점(프론트엔드) 책임이다.
- **SHOULD** API 경로 prefix는 `/api`로 시작한다.
- **MAY** API 버저닝(`/api/v1/...`)은 브레이킹 체인지가 발생할 때 도입한다.

### HTTP 상태 코드 규약

| 상황 | 상태 코드 | 비고 |
|------|----------|------|
| 조회 성공 | 200 OK | |
| 생성 성공 | 201 Created | `Location` 헤더에 생성된 리소스 URI 포함 |
| 삭제 성공 | 204 No Content | 응답 바디 없음 |
| 형식 검증 실패 | 400 Bad Request | Bean Validation 오류 |
| 인증 실패 | 401 Unauthorized | 인증 도입 시 적용 |
| 권한 없음 | 403 Forbidden | |
| 리소스 없음 | 404 Not Found | |
| 서버 오류 | 500 Internal Server Error | |

### 현재 API 구조 (기준점)

```
GET  /api/posts/{slug}/comments     # 200 — 특정 포스트의 댓글 목록 조회
POST /api/posts/{slug}/comments     # 201 — 댓글 작성
```

### ProblemDetail 응답 예시

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "댓글 id=99 를 찾을 수 없습니다",
  "instance": "/api/posts/my-post/comments/99",
  "code": "NOT_FOUND"
}
```

> **NOTE**: `type`, `title`, `instance` 등 각 필드의 세부 규약은 첫 번째 에러 응답 구현 시 확정한다.

---
