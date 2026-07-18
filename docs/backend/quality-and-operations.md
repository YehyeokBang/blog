# 백엔드 품질·운영 규칙

- **적용 범위**: `backend/` 하위 Kotlin 코드의 품질, 테스트, 빌드, 운영·검토 기준
- **상위 진입점**: [백엔드 컨벤션](README.md)

구현 전 [백엔드 컨벤션](README.md)의 역할별 읽기 순서를 확인한다. 이 문서는 기존 컨벤션의 1절, 11–12절, 14–18절과 변경 이력을 역할 기준으로 옮긴 것이다.

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
