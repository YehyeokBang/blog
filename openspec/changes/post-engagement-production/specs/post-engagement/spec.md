## ADDED Requirements

### Requirement: Paged feed engagement projection
시스템은 active post를 `slug ASC`로 안정 정렬한 zero-based page에 `likeCount`와 `commentCount`를 함께 반환해야 한다(MUST). 기본 size는 20이고 최대 size는 100이어야 한다(MUST). frontend는 정적 article 목록을 API로 다시 조회하거나 글별 반응 N+1 요청을 만들면 안 된다(MUST NOT).

#### Scenario: Feed projection page
- **WHEN** 클라이언트가 `GET /api/post-engagements?page=0&size=20`을 요청한다
- **THEN** 시스템은 각 content item에 slug, likeCount, commentCount를 담아 HTTP 200으로 반환한다
- **AND** page, size, totalElements, totalPages, last metadata를 함께 반환한다
- **AND** 같은 데이터 상태의 반복 요청은 같은 page 경계와 순서를 반환한다

#### Scenario: Empty page
- **WHEN** 클라이언트가 마지막 page 뒤의 유효한 page 번호를 요청한다
- **THEN** 시스템은 빈 content와 HTTP 200을 반환한다

#### Scenario: Invalid pagination
- **WHEN** page가 음수이거나 size가 1..100 범위를 벗어난다
- **THEN** 시스템은 HTTP 400 ProblemDetail과 `code: INVALID_REQUEST`를 반환한다

### Requirement: Detail engagement projection
시스템은 active slug의 likeCount, commentCount와 현재 anonymous visitor의 liked 상태를 반환해야 한다(MUST). 조회만으로 anonymous cookie 또는 visitor row를 만들면 안 된다(MUST NOT).

#### Scenario: Visitor with existing like
- **WHEN** 유효한 anonymous cookie를 가진 방문자가 좋아요한 active slug의 engagement를 조회한다
- **THEN** 시스템은 HTTP 200과 `liked: true` 및 DB count를 반환한다

#### Scenario: Visitor without cookie
- **WHEN** cookie가 없는 방문자가 active slug의 engagement를 조회한다
- **THEN** 시스템은 HTTP 200과 `liked: false` 및 DB count를 반환한다
- **AND** Set-Cookie를 보내거나 visitor row를 만들지 않는다

#### Scenario: Missing or invalid slug
- **WHEN** inactive 또는 unknown slug를 조회한다
- **THEN** 시스템은 HTTP 404 ProblemDetail과 `code: NOT_FOUND`를 반환한다
- **WHEN** slug 형식이 유효하지 않다
- **THEN** 시스템은 HTTP 400 ProblemDetail과 `code: INVALID_REQUEST`를 반환한다

### Requirement: Idempotent anonymous like desired state
시스템은 `PUT /api/posts/{slug}/like`로 liked 상태를, `DELETE /api/posts/{slug}/like`로 unliked 상태를 멱등 적용해야 한다(MUST). 성공 응답은 서버 DB에서 확인한 liked, likeCount, commentCount와 changed를 반환해야 한다(MUST).

#### Scenario: First like and duplicate like
- **WHEN** cookie 없는 방문자가 active slug에 처음 PUT을 보낸다
- **THEN** 시스템은 visitor와 like를 하나씩 저장하고 HTTP 200, `liked: true`, `changed: true`를 반환한다
- **AND** 보안 속성이 적용된 anonymous cookie를 설정한다
- **WHEN** 같은 cookie로 PUT을 재시도한다
- **THEN** likeCount를 늘리지 않고 HTTP 200, `liked: true`, `changed: false`를 반환한다

#### Scenario: Unlike and duplicate unlike
- **WHEN** 좋아요한 방문자가 같은 slug에 DELETE를 보낸다
- **THEN** 시스템은 like row 하나를 제거하고 HTTP 200, `liked: false`, `changed: true`를 반환한다
- **WHEN** 같은 DELETE를 재시도하거나 cookie 없이 DELETE한다
- **THEN** count를 줄이지 않고 HTTP 200, `liked: false`, `changed: false`를 반환한다

#### Scenario: Mutation error states
- **WHEN** inactive 또는 unknown slug에 PUT 또는 DELETE를 보낸다
- **THEN** 시스템은 HTTP 404 ProblemDetail과 `code: NOT_FOUND`를 반환한다
- **WHEN** slug 형식이 유효하지 않다
- **THEN** 시스템은 HTTP 400 ProblemDetail과 `code: INVALID_REQUEST`를 반환한다

### Requirement: Anonymous cookie security and CSRF defense
시스템은 cookie에 cryptographically secure UUID v4 무작위 식별자만 저장해야 하고(MUST), production에서 `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/api`, `Max-Age=31536000`, host-only 속성을 적용해야 한다(MUST). state-changing 요청은 exact Origin allowlist를 통과해야 한다(MUST).

#### Scenario: Accepted same-origin mutation
- **WHEN** PUT 또는 DELETE Origin이 `https://blog.yehyeok.xyz`이다
- **THEN** 시스템은 business mutation을 처리한다

#### Scenario: Rejected cross-origin mutation
- **WHEN** production PUT 또는 DELETE Origin이 누락되거나 `null`이거나 allowlist와 다르다
- **THEN** 시스템은 DB를 변경하지 않고 HTTP 403 ProblemDetail과 `code: FORBIDDEN`을 반환한다

#### Scenario: Cookie data boundary
- **WHEN** anonymous cookie와 DB visitor를 검사한다
- **THEN** cookie에는 무작위 식별자 외 slug, like 사실, count, IP, user-agent가 없다
- **AND** DB는 cookie 원문이 아닌 SHA-256 digest만 저장한다

### Requirement: Transactional like consistency
시스템은 `(post_id, visitor_id)` unique constraint와 service transaction으로 브라우저당 글당 최대 하나의 like만 허용해야 한다(MUST). likeCount는 like row aggregate여야 하며 저장된 음수 counter를 두면 안 된다(MUST NOT).

#### Scenario: Concurrent likes
- **WHEN** 같은 visitor와 slug의 PUT이 동시에 실행된다
- **THEN** 최종 like row는 하나이고 likeCount는 한 번만 증가한다

#### Scenario: Concurrent cancellations
- **WHEN** 같은 visitor와 slug의 DELETE가 동시에 실행된다
- **THEN** 최종 like row는 없고 likeCount는 0 아래로 내려가지 않는다

#### Scenario: Competing desired states
- **WHEN** 같은 visitor와 slug의 PUT과 DELETE가 경쟁한다
- **THEN** DB가 마지막으로 commit한 desired-state operation과 최종 row 상태가 일치한다
- **AND** 각 성공 응답의 count는 해당 transaction에서 flush된 상태를 반영한다

### Requirement: Versioned additive SQLite migration
시스템은 version table과 transaction을 사용하는 순번 migration으로 anonymous visitor, post like, FK, unique constraint와 lookup index를 추가해야 한다(MUST). production Hibernate는 schema를 자동 변경하면 안 되며 `ddl-auto=validate`를 사용해야 한다(MUST).

#### Scenario: First migration
- **WHEN** 기존 comment DB에 engagement migration을 적용한다
- **THEN** 기존 post와 comment row를 보존하고 새 schema와 migration version을 원자적으로 추가한다

#### Scenario: Repeated migration
- **WHEN** 같은 version을 다시 실행한다
- **THEN** schema와 data를 중복 변경하지 않고 성공한다

#### Scenario: Failed migration
- **WHEN** migration statement 또는 schema 검증이 실패한다
- **THEN** transaction을 rollback하고 새 backend image로 교체하지 않는다
