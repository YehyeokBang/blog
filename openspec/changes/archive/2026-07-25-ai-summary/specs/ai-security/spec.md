## ADDED Requirements

### Requirement: 본문 버전 기반 2계층 캐싱
The system SHALL cache only successfully completed and validated summaries in both an in-memory cache and a separate `ai_summary` SQLite table. Cache validity SHALL be determined by `slug`, a SHA-256 hash of the exact normalized post content sent to the model, model identifier, and prompt version. The SQLite table SHALL use `slug` as its logical post identifier and SHALL NOT have a physical foreign key constraint to the `post` table.

#### Scenario: 최초 요청 시 캐시 미스 및 저장
- **WHEN** no cache entry matches the active post's slug, content hash, model identifier, and prompt version
- **THEN** the system reserves daily quota, generates and validates the summary, streams it, and stores the complete result with all cache-version fields in SQLite and the in-memory cache

#### Scenario: 유효한 캐시 히트
- **WHEN** a cache entry matches the active post's slug, content hash, model identifier, and prompt version
- **THEN** the system streams the cached summary as SSE chunks with a cancellable simulated delay without calling Gemini or incrementing daily AI usage

#### Scenario: 본문 수정 후 캐시 미스
- **WHEN** the markdown body changes while its filename and slug remain unchanged
- **THEN** the generated content hash changes, the previous SQLite and in-memory entries are treated as stale, and the next request generates a new summary

#### Scenario: 모델 또는 프롬프트 변경 후 캐시 미스
- **WHEN** the configured model identifier or prompt version changes
- **THEN** the previous cache entry is treated as stale and is not returned

#### Scenario: 포스트 삭제 또는 비활성화
- **WHEN** a slug is removed from the post manifest or becomes inactive
- **THEN** the system evicts its in-memory entry, deletes or marks its SQLite summary unusable during manifest synchronization, and rejects subsequent summary requests with `404 Not Found`

#### Scenario: 동일 slug 재사용
- **WHEN** a previously removed slug is added again with different content
- **THEN** the system does not serve the old summary because the active content hash must match before any cache hit

#### Scenario: 생성 취소 또는 실패
- **WHEN** generation is cancelled, times out, fails, or produces an invalid 3-line result
- **THEN** the system stores neither a partial summary nor a successful cache marker in either cache layer

### Requirement: 포스트 manifest의 요약 입력 및 버전 정보
The generated backend post manifest SHALL provide each active slug with the server-owned normalized summary input or another server-readable content source and its SHA-256 content hash. A slug-only manifest SHALL NOT be considered sufficient for summary generation or invalidation.

#### Scenario: manifest 생성
- **WHEN** the backend post manifest is generated during the build
- **THEN** each entry contains the slug, the normalized content used for the model or a resolvable server-owned content reference, and the hash of that exact normalized content

#### Scenario: manifest와 실제 입력 불일치
- **WHEN** the hash calculated from the model input differs from the hash recorded in the manifest
- **THEN** the system fails closed for that post, does not call Gemini, and records an operational error without serving a possibly stale cache

### Requirement: 동일 캐시 키 단일 생성
The system SHALL provide single-flight coordination for each cache version key so that concurrent cache misses for the same slug, content hash, model, and prompt version share one in-progress Gemini generation.

#### Scenario: 동일 포스트 동시 최초 요청
- **WHEN** multiple clients concurrently request the same uncached summary version
- **THEN** at most one Gemini request and one daily quota reservation are created, and all still-connected clients observe the shared result

#### Scenario: 공유 생성 중 일부 클라이언트 취소
- **WHEN** one subscriber disconnects while other subscribers still await the same single-flight generation
- **THEN** only the disconnected subscriber is removed and the shared generation continues for the remaining subscribers

#### Scenario: 공유 생성의 모든 클라이언트 취소
- **WHEN** every subscriber disconnects before the shared generation completes
- **THEN** the system cancels the Gemini request, removes the in-flight entry, releases concurrency capacity, and does not cache a partial result

### Requirement: 조건부 원자 연산 기반 일일 Gemini 한도
The system SHALL persistently track daily Gemini call reservations in `ai_daily_usage`. The quota day and timezone SHALL be explicitly configured. A generation request SHALL reserve quota with one atomic SQLite statement that increments only when the current count is below the configured limit. A separate read-then-increment sequence SHALL NOT be used, and no database transaction SHALL remain open during the Gemini network call.

#### Scenario: 한도 내 원자적 예약
- **WHEN** an uncached generation request arrives while the daily count is below the limit
- **THEN** one conditional `INSERT ... ON CONFLICT DO UPDATE ... WHERE usage_count < :limit RETURNING ...` operation reserves exactly one call before Gemini is invoked

#### Scenario: 동시 요청이 마지막 한도와 경합
- **WHEN** multiple requests concurrently attempt to reserve the final remaining daily call
- **THEN** exactly one reservation succeeds and all other requests receive the configured unavailable fallback without calling Gemini

#### Scenario: 일일 한도 도달
- **WHEN** the daily usage count has reached the configured maximum
- **THEN** uncached generation requests do not call Gemini and receive the configured unavailable fallback, while valid cached summaries remain available

#### Scenario: 캐시 히트
- **WHEN** a valid summary cache entry is served
- **THEN** the daily Gemini usage count is not changed

#### Scenario: 애플리케이션 재시작
- **WHEN** the backend restarts during a quota day
- **THEN** the persisted usage count remains effective and prevents the restart from resetting the daily limit

### Requirement: Traefik 요청 속도 및 동시 생성 방어
The system SHALL route the exact AI summary GET endpoint through a dedicated higher-priority Traefik router. The router SHALL apply a per-client-IP token-bucket rate limit with explicit `average`, `period`, and `burst` values. The system SHALL separately enforce a bounded global number of active Gemini generations because request rate limiting alone does not limit the number of long-lived SSE connections.

#### Scenario: 정상 호출 횟수 내 요청
- **WHEN** a client requests a summary within the configured `average` per explicit `period` and concurrency capacity is available
- **THEN** Traefik forwards the request to the backend

#### Scenario: 요청 속도 초과
- **WHEN** a client exhausts the configured token bucket
- **THEN** Traefik returns `429 Too Many Requests` before the request reaches the Spring Boot backend

#### Scenario: burst 설정
- **WHEN** the dedicated middleware is rendered from Docker Compose configuration
- **THEN** its `period` is explicitly present and the burst is small enough that it cannot admit an unbounded group of simultaneous long-lived streams

#### Scenario: Gemini 동시 생성 한도 초과
- **WHEN** the number of active uncached Gemini generations reaches the configured global limit
- **THEN** the backend rejects or queues the new generation within a bounded limit and does not create another Gemini request, while cache hits remain serviceable

#### Scenario: 클라이언트 IP 기준 검증
- **WHEN** Traefik is the public edge without another untrusted proxy in front of it
- **THEN** the rate limiter uses the connection remote address and does not trust an arbitrary client-supplied forwarding header

### Requirement: SSE 응답 비버퍼링 프록시 구성
The system SHALL preserve incremental SSE delivery through the production edge path. A Traefik buffering middleware with `maxRequestBodyBytes=0` SHALL NOT be described or used as response-buffering control because that value only means an unlimited request body. The AI router SHALL not attach response buffering, caching, or transformation middleware that delays SSE chunks.

#### Scenario: Traefik 직접 라우팅
- **WHEN** Traefik routes the AI endpoint directly to the Spring Boot backend
- **THEN** the response is streamed without attaching the buffering middleware and the first SSE event reaches the client before generation completes

#### Scenario: Nginx가 응답 경로에 추가됨
- **WHEN** an Nginx proxy is introduced into the AI response path
- **THEN** its SSE location uses `proxy_buffering off` or honors the backend's `X-Accel-Buffering: no` header

#### Scenario: 프록시 idle timeout
- **WHEN** the production proxy and backend timeout configuration is evaluated
- **THEN** the SSE heartbeat interval is shorter than every applicable idle or read timeout

#### Scenario: 운영 스트리밍 검증
- **WHEN** the deployed endpoint is requested through the public Traefik route using a non-buffering client such as `curl -N`
- **THEN** response headers identify `text/event-stream`, heartbeat or delta bytes arrive incrementally, and the dedicated router's rate and concurrency protections are observable
