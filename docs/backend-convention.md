# 백엔드 코딩 컨벤션

- **버전**: 1.1.1
- **최종 수정일**: 2026-07-18
- **적용 범위**: `backend/` 하위 모든 Kotlin 코드
- **기술 스택**: Kotlin 2.3 + Spring Boot 4.1 + JPA(SQLite→PostgreSQL) + WebMVC

> 이 문서는 실제 코드를 기준으로 인터뷰를 통해 확정한 컨벤션입니다.
> AI 에이전트 포함 모든 기여자는 이 문서를 따릅니다.
> 규칙 변경 시 이 문서를 먼저 수정하고, 코드를 그 다음에 반영합니다.

---

## 목차

1. [코드 포매팅 & 린터](#1-코드-포매팅--린터)
2. [네이밍](#2-네이밍)
3. [패키지 구조 & 아키텍처](#3-패키지-구조--아키텍처)
4. [Null 처리](#4-null-처리)
5. [JPA Entity 설계](#5-jpa-entity-설계)
6. [DTO 매핑 전략](#6-dto-매핑-전략)
7. [예외 처리 & 에러 응답](#7-예외-처리--에러-응답)
8. [트랜잭션](#8-트랜잭션)
9. [입력 검증](#9-입력-검증)
10. [비동기 / 동시성](#10-비동기--동시성)
11. [테스트](#11-테스트)
12. [로깅](#12-로깅)
13. [API 설계](#13-api-설계)
14. [Gradle & 의존성](#14-gradle--의존성)
15. [DB 스키마 관리](#15-db-스키마-관리)
16. [Git & CI](#16-git--ci)
17. [의도적으로 채택하지 않은 것들](#17-의도적으로-채택하지-않은-것들deliberately-rejected)
18. [코드리뷰 체크리스트](#18-코드리뷰-체크리스트)

---

## 1. 코드 포매팅 & 린터

### 규칙

- **MUST** `ktlint`를 Gradle 플러그인으로 도입한다.
- **MUST** 들여쓰기는 **스페이스 4칸**을 사용한다. 탭 금지.
- **MUST** 최대 줄 길이는 **120자**로 제한한다.
- **MUST** CI에서 `ktlintCheck`가 실패하면 머지를 막는다.
- **SHOULD** 커밋 전 `./gradlew ktlintFormat`으로 자동 수정 후 커밋한다.

### 근거

ktlint는 Kotlin 공식 코딩 컨벤션을 기반으로 하며 제로 설정으로 동작한다.
AI 에이전트가 생성한 코드도 `ktlintFormat` 한 번으로 스타일이 통일된다.
들여쓰기 불일치가 발생하더라도 ktlint 도입으로 즉시 해결된다.

### 설정 방법

**`build.gradle.kts`에 추가:**

```kotlin
plugins {
    alias(libs.plugins.ktlint)
}

ktlint {
    version.set("1.5.0")
    android.set(false)
    outputToConsole.set(true)
}
```

**`.editorconfig` (프로젝트 루트에 생성):**

```ini
root = true

[*.{kt,kts}]
indent_style = space
indent_size = 4
max_line_length = 120
insert_final_newline = true
trim_trailing_whitespace = true
```

**Gradle 주요 명령:**

```bash
./gradlew ktlintCheck    # 스타일 검사 (CI에서 실행)
./gradlew ktlintFormat   # 자동 수정 (커밋 전 실행)
```

### 좋은 예 / 나쁜 예

```kotlin
// ✅ 스페이스 4칸
class CommentService(
    private val commentRepository: CommentRepository
) {
    fun getComments(): List<CommentResponse> {
        return commentRepository.findAll()
    }
}

// ❌ 탭 사용
class CommentService(
	private val commentRepository: CommentRepository  // 탭
)
```

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

## 11. 테스트

### 규칙

- **MUST** 테스트 프레임워크는 **JUnit5**를 사용한다. Kotest 프레임워크(StringSpec, BehaviorSpec 등)는 사용하지 않는다.
- **MUST** 단언(assertion)은 **kotest-assertions-core**만 사용한다. (`shouldBe`, `shouldThrow` 등)
- **MUST** 모킹은 **MockK**를 사용한다.
- **MUST** 테스트 메서드명은 **백틱 한글**로 작성한다.
- **MUST** 테스트 본문 구조는 `// given / // when / // then` 주석으로 구분한다.
- **SHOULD** 단위 테스트(Service)와 통합 테스트(Controller)를 분리한다.
- **SHOULD** `@SpringBootTest`는 통합 테스트에만 사용한다. Service 단위 테스트는 `@ExtendWith(MockKExtension::class)`만 사용한다.

### 근거

MockK는 Kotlin의 `final` 클래스를 별도 설정 없이 모킹할 수 있다.
kotest-assertions-core는 Kotest 프레임워크 없이 단언 API만 독립적으로 사용 가능하다. `shouldBe`/`shouldThrow` 등의 표현이 JUnit5 `assertEquals`보다 가독성이 높다.

### 의존성 추가

```kotlin
// build.gradle.kts (또는 libs.versions.toml 경유)
testImplementation(libs.mockk)
testImplementation(libs.kotest.assertions)
```

### 좋은 예

```kotlin
@ExtendWith(MockKExtension::class)
class CommentServiceTest {

    @MockK
    lateinit var commentRepository: CommentRepository

    @InjectMockKs
    lateinit var commentService: CommentService

    @Test
    fun `존재하지 않는 슬러그로 조회하면 빈 리스트를 반환한다`() {
        // given
        every {
            commentRepository.findAllByPostSlugOrderByCreatedAtAsc("없는슬러그")
        } returns emptyList()

        // when
        val result = commentService.getCommentsBySlug("없는슬러그")

        // then
        result shouldBe emptyList()
    }

    @Test
    fun `존재하지 않는 포스트 슬러그로 댓글을 작성하면 NotFoundException이 발생한다`() {
        // given
        val request = CommentRequest(
            authorName = "홍길동",
            authorAvatar = "https://example.com/avatar.png",
            content = "테스트 댓글",
        )

        every {
            postRepository.findBySlug("not-exist-post")
        } returns null

        // when & then
        shouldThrow<NotFoundException> {
            commentService.createComment("not-exist-post", request)
        }
    }
}
```

---

## 12. 로깅

### 규칙

- **MUST** 로거는 `kotlin-logging` (`io.github.oshai:kotlin-logging-jvm`)을 사용한다.
- **MUST** 로거 선언은 **파일 최상단 `private val`** 로 한다. `companion object` 금지.
- **MUST** 로그 메시지는 **람다 `{ }` 문법**을 사용한다. 문자열 직접 전달 금지.
- **MUST** 로그에 개인정보(이름, IP 등)를 평문으로 기록하지 않는다.
- **SHOULD** 로그 레벨 기준: `DEBUG`(개발 상세), `INFO`(정상 흐름 주요 이벤트), `WARN`(예상 가능한 오류), `ERROR`(예상 못한 서버 오류)

### 의존성 추가

```kotlin
implementation(libs.kotlin.logging)
```

### 좋은 예 / 나쁜 예

```kotlin
// ✅ 파일 최상단 선언 + 람다 문법
private val logger = KotlinLogging.logger {}

class CommentService(private val commentRepository: CommentRepository) {
    fun createComment(postSlug: String, request: CommentRequest): CommentResponse {
        logger.info { "댓글 생성 요청: postSlug=$postSlug" }
        val saved = commentRepository.save(comment)
        logger.debug { "댓글 저장 완료: id=${saved.id}" }
        return saved.toResponse()
    }
}

// ❌ companion object 사용
class CommentService {
    companion object {
        private val logger = LoggerFactory.getLogger(CommentService::class.java)
    }
}

// ❌ 문자열 직접 전달 (레벨 꺼져도 조합 실행됨)
logger.debug("댓글 저장 완료: id=" + saved.id)
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

## 14. Gradle & 의존성

### 규칙

- **MUST** 의존성 버전은 **Version Catalog** (`gradle/libs.versions.toml`)로 중앙 관리한다.
- **MUST** `build.gradle.kts`에 버전 문자열을 직접 명시하지 않는다.
- **SHOULD** 새 의존성 추가 시 `libs.versions.toml`을 먼저 수정하고, `build.gradle.kts`에서 참조한다.

### 근거

같은 라이브러리의 버전이 여러 곳에 중복되면 업그레이드 시 누락이 생긴다.
Version Catalog 도입으로 이 문제가 해결되고, Dependabot이 TOML을 자동 파싱해 의존성 업데이트 PR을 자동으로 열어준다.

### `gradle/libs.versions.toml`

```toml
[versions]
kotlin = "2.3.21"
spring-boot = "4.1.0"
spring-dependency-management = "1.1.7"
kotlin-logging = "7.0.3"
mockk = "1.13.12"
kotest = "5.9.1"
ktlint-plugin = "12.1.2"
ktlint = "1.5.0"

[libraries]
kotlin-reflect = { module = "org.jetbrains.kotlin:kotlin-reflect" }
jackson-module-kotlin = { module = "tools.jackson.module:jackson-module-kotlin" }
sqlite-jdbc = { module = "org.xerial:sqlite-jdbc" }
hibernate-community-dialects = { module = "org.hibernate.orm:hibernate-community-dialects" }
kotlin-logging = { module = "io.github.oshai:kotlin-logging-jvm", version.ref = "kotlin-logging" }
mockk = { module = "io.mockk:mockk", version.ref = "mockk" }
kotest-assertions = { module = "io.kotest:kotest-assertions-core", version.ref = "kotest" }

[plugins]
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-spring = { id = "org.jetbrains.kotlin.plugin.spring", version.ref = "kotlin" }
kotlin-jpa = { id = "org.jetbrains.kotlin.plugin.jpa", version.ref = "kotlin" }
spring-boot = { id = "org.springframework.boot", version.ref = "spring-boot" }
spring-dependency-management = { id = "io.spring.dependency-management", version.ref = "spring-dependency-management" }
ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint-plugin" }
```

### `build.gradle.kts` (변환 후)

```kotlin
plugins {
    alias(libs.plugins.kotlin.jvm)
    alias(libs.plugins.kotlin.spring)
    alias(libs.plugins.spring.boot)
    alias(libs.plugins.spring.dependency.management)
    alias(libs.plugins.kotlin.jpa)
    alias(libs.plugins.ktlint)
}

dependencies {
    implementation(libs.kotlin.reflect)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.kotlin.logging)
    runtimeOnly(libs.sqlite.jdbc)
    implementation(libs.hibernate.community.dialects)
    testImplementation(libs.mockk)
    testImplementation(libs.kotest.assertions)
}
```

---

## 15. DB 스키마 관리

### 규칙

- **MAY** SQLite 단계에서는 `ddl-auto: update` 허용한다.
- **MUST** PostgreSQL 전환 시 **Flyway**를 도입하고 `ddl-auto: validate`로 전환한다.
- **MUST** Flyway 도입 후 스키마 변경은 반드시 마이그레이션 파일(`V{n}__{description}.sql`)로 관리한다.

### 근거

`ddl-auto: update`는 소규모 초기 개발에서 속도를 높여주지만, 운영 환경에서는 의도치 않은 스키마 변경을 유발한다.
Flyway는 마이그레이션 이력을 DB에 기록하여 모든 환경에서 스키마 일관성을 보장한다.

---

## 16. Git & CI

### 규칙

- **MUST** 커밋 메시지는 Conventional Commits를 따른다: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`
- **MUST** 머지 조건: `ktlintCheck` + `test` + `build` 3개 모두 통과해야 한다.
- **MUST** 시크릿(API 키, DB 비밀번호 등)은 저장소에 커밋하지 않는다. 환경변수 또는 외부 프로파일로 주입한다.

### 커밋 메시지 예시

```bash
feat: 댓글 작성 API 추가
fix: 조회수 lost update 버그 수정
refactor: CommentService 트랜잭션 경계 정리
test: CommentService 단위 테스트 추가
docs: backend-convention.md 1.1.0 개정
chore: ktlint 플러그인 도입
```

---

## 17. 의도적으로 채택하지 않은 것들(Deliberately Rejected)

| 도구/패턴 | 원래 해결하려는 문제 | 채택하지 않은 이유 | 대신 커버하는 방법 | 재도입 트리거 |
|----------|---------------------|------------------|-----------------|-------------|
| **detekt** | 순환 복잡도, 코드 스멜, 아키텍처 규칙 위반 자동 감지 | 초기 단계에서 잡아줄 것이 없음. `detekt.yml` 관리 부담이 이득을 초과 | AI 에이전트 리뷰 + 자기 코드리뷰 | 파일 50개+ 또는 팀원 합류 시 |
| **Kotest 프레임워크** | Kotlin 관용적 DSL 테스트, 코루틴 네이티브 테스트 | **프레임워크**는 Spring Boot 통합 설정 추가 및 학습곡선. JUnit5로 충분. **단언 라이브러리(kotest-assertions-core)는 채택** | JUnit5 + MockK + kotest-assertions-core | 코루틴 전면 도입 또는 property-based 테스트 필요 시 |
| **코루틴 / WebFlux** | 대규모 비동기 I/O, 높은 동시성 처리 | 활성화된 Virtual Threads로 현재 트래픽 규모에서 충분. WebMVC에서 코루틴은 복잡도 증가 | `spring.threads.virtual.enabled=true`로 활성화한 Virtual Threads | WebFlux 전환 또는 MSA 간 비동기 통신 필요 시 |
| **UseCase 레이어** | 비즈니스 흐름 오케스트레이션, 단일 책임 원칙 | 현재 모든 기능이 단순 CRUD 수준. UseCase가 Service의 통과 클래스가 됨 | Service가 비즈니스 로직 담당 | 하나의 API가 2개 이상 도메인 서비스를 조합할 때 |
| **Spotless** | 멀티언어 일괄 포맷 관리 | Kotlin 단일 언어 프로젝트라 ktlint 단독으로 충분 | ktlint 단독 | Java 코드가 공존하거나 다국어 포맷 통합 필요 시 |
| **Flyway** | DB 스키마 버전 관리 및 마이그레이션 | SQLite 개발 단계에서는 `ddl-auto: update`로 충분 | `ddl-auto: update` | PostgreSQL 전환 시 |
| **페이지네이션** | 대량 목록 응답 성능 및 UX 개선 | 현재 데이터 규모에서 단순 전체 반환으로 충분 | 전체 목록 반환 | 단일 목록 응답이 100건을 초과할 때. 도입 시 offset 방식, 기본 size=20, 최대 100 |

---

## 18. 코드리뷰 체크리스트

커밋 또는 PR 전 아래 항목을 확인한다.

### 포맷 & 스타일
- [ ] `./gradlew ktlintCheck` 통과
- [ ] 들여쓰기가 스페이스 4칸인가
- [ ] `!!` 사용이 없는가

### 설계
- [ ] Entity가 `class`(not `data class`)인가
- [ ] Entity ID가 `var id: Long? = null`인가
- [ ] Entity 날짜/시간이 `Instant`를 사용하는가 (`LocalDateTime` 금지)
- [ ] Entity 상태 변경이 직접 대입이 아닌 메서드를 통하는가
- [ ] DTO가 Entity를 참조하지 않는가
- [ ] Entity → DTO 확장 함수가 `api/` 계층에 있는가
- [ ] 패키지 구조가 `feature/api|domain|infra`를 따르는가

### 트랜잭션 & 검증
- [ ] `@Transactional`이 Service에만 있는가 (Controller/Repository 금지)
- [ ] 조회 전용 메서드에 `@Transactional(readOnly = true)`가 있는가
- [ ] `@Modifying` 호출 Service 메서드에 `@Transactional`이 있는가
- [ ] Controller DTO에 `@Valid`가 있는가
- [ ] Bean Validation 어노테이션(`@NotBlank`, `@Size` 등)이 `@field:` 접두사를 사용하는가

### 예외 & 로깅
- [ ] 비즈니스 예외가 `BusinessException`을 상속하는가
- [ ] 로거가 파일 최상단 `private val logger = KotlinLogging.logger {}`인가
- [ ] 로그 메시지가 람다 `{ }` 문법을 사용하는가
- [ ] 로그에 개인정보가 평문으로 없는가
- [ ] 설정 파일 등에 시크릿 평문이 없는가

### 테스트
- [ ] 테스트 메서드명이 백틱 한글인가
- [ ] given/when/then 구조가 있는가
- [ ] 단언에 kotest-assertions-core(`shouldBe` 등)를 사용하는가
- [ ] 새 로직에 단위 테스트가 추가되었는가

---

## 변경 이력

| 버전 | 날짜 | 주요 변경 내용 |
|------|------|-------------|
| **1.1.1** | 2026-07-18 | **[P0]** 검증 규칙과 테스트 예시 충돌 해소. **[P1]** Entity `require` 예외 처리용 `IllegalArgumentException` 핸들러 추가, DTO `Instant` 직렬화 규칙 변경. **[P2]** 1절/12절 버전 하드코딩 제거, 13절 401 주석 추가, 18절 시크릿 체크리스트 보강. |
| **1.1.0** | 2026-07-18 | **[P0]** 테스트 단언 라이브러리 모순 해소(kotest-assertions-core 공식 채택), DTO 매핑 확장 함수 위치 모순 해소(domain/ → api/), Entity 상태 변경 메서드 규칙 명확화. **[P1]** 트랜잭션 섹션 신설(8절), 입력 검증 섹션 신설(9절), DB 스키마 관리 섹션 신설(15절), 날짜/시간 UTC Instant 규약 추가(5·6절). **[P2]** HTTP 상태 코드 규약 표 추가(13절), ProblemDetail code 필드 추가(7절), Git & CI 섹션 신설(16절), 페이지네이션/XSS 규약 추가, GlobalExceptionHandler logger 선언 추가. **[P3]** 근거 일반 서술 교체, 목차·버전 갱신, 변경 이력 섹션 신설. |
| **1.0.0** | 2026-07-18 | 최초 작성 — 12개 주제 컨벤션 인터뷰 확정 |
