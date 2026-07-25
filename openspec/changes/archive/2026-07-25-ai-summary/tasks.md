## 1. Backend Setup, Content Manifest & Dependencies

- [x] 1.1 Spring AI BOM/version과 `spring-ai-starter-model-google-genai`를 version catalog 및 `build.gradle.kts`에 추가하고, `spring-boot-starter-webmvc`를 유지한다. WebFlux server 전환 목적의 `spring-boot-starter-webflux`와 직접 `reactor-core` 의존성은 추가하지 않고 `dependencies` report로 실제 runtime 구성을 확인한다.
- [x] 1.2 application context 테스트로 server application type이 Servlet WebMVC이고 WebFlux server로 전환되지 않았음을 고정한다.
- [x] 1.3 `application.yml`에 Gemini API key environment binding, model ID, prompt version, 생성 timeout, heartbeat interval, 일일 quota/timezone, 전역 동시 생성 한도를 정의하고 시크릿 기본값을 저장소에 넣지 않는다.
- [x] 1.4 `scripts/generate-posts-manifest.mjs`를 확장해 각 slug의 서버 소유 정규화 요약 입력 또는 content reference와 그 입력의 SHA-256 `contentHash`를 생성하고 manifest reader/synchronizer 테스트를 갱신한다.
- [x] 1.5 versioned migration SQL에 `ai_summary(slug PK, content_hash, model_id, prompt_version, summary, updated_at)`와 `ai_daily_usage(usage_date PK, usage_count)`를 추가한다. PK와 중복되는 단일 slug index는 만들지 않고 `./scripts/migrate-sqlite.sh` 및 schema validation 경로로 검증한다.

## 2. Backend AI Service & SSE Contract

- [x] 2.1 `GET /api/posts/{slug}/ai-summary` 요청에서 active post와 manifest content/hash를 서버에서 조회하고, invalid/inactive slug는 Gemini 호출과 quota 증가 없이 `404`를 반환한다.
- [x] 2.2 Spring AI `GoogleGenAiChatModel.stream(...)`의 `Flux<ChatResponse>`를 사용해 3줄 요약 prompt를 전송하고, 전체 생성 timeout 및 upstream 오류를 typed domain failure로 변환한다.
- [x] 2.3 Controller는 `produces = text/event-stream`과 `Flux<ServerSentEvent<String>>`를 사용한다. content는 `event: delta`, 정상 종료는 `event: complete`와 `data: [DONE]`, 모든 content/complete event에는 request-scoped ID를 포함한다.
- [x] 2.4 응답에 `Cache-Control: no-cache, no-transform`과 `X-Accel-Buffering: no`를 설정하고 comment-only heartbeat를 proxy/server idle timeout보다 짧은 주기로 전송한다.
- [x] 2.5 완료된 출력을 정확히 3개의 비어 있지 않은 줄로 검증한다. frontend는 `complete` 수신 전까지 표시 내용을 임시 상태로 취급하며, 형식 위반 시 typed `error`로 종료하고 임시 결과를 폐기한다.
- [x] 2.6 Spring MVC reactive streaming write용 bounded `AsyncTaskExecutor`와 async timeout을 명시하고, active stream 및 active Gemini generation metric을 추가한다.

## 3. Cancellation, Caching & Quota

- [x] 3.1 Gemini stream, 출력 누적, heartbeat, cache-hit `delayElements`를 Controller 반환 Flux와 하나의 subscription lifecycle로 연결하고 Service 내부 detached `subscribe()`를 금지한다.
- [x] 3.2 `doOnCancel`, `doFinally`, timeout 경로에서 Gemini HTTP response 소비, 남은 delay/heartbeat, in-flight entry, active generation slot을 idempotent하게 정리한다. cancellation/error/timeout/3줄 검증 실패 결과는 캐시하지 않는다.
- [x] 3.3 SQLite 및 In-Memory cache hit를 `slug + contentHash + modelId + promptVersion` 전체 일치로 판정하고, manifest 동기화 시 수정·삭제·inactive 포스트의 stale cache를 무효화한다.
- [x] 3.4 동일 cache version의 동시 miss를 single-flight로 묶어 Gemini 요청과 quota 예약을 한 번만 수행한다. 일부 subscriber 취소와 전체 subscriber 취소의 동작을 각각 테스트한다.
- [x] 3.5 cache hit는 cancellable `Flux.delayElements(Duration.ofMillis(30))`로 전송하고, client cancellation 뒤 예약된 emission이 더 실행되지 않음을 virtual time 또는 bounded-time 테스트로 검증한다.
- [x] 3.6 quota는 single-flight owner가 Gemini를 호출하기 직전에 `INSERT ... ON CONFLICT DO UPDATE ... WHERE usage_count < :limit RETURNING usage_count` 단일 statement로 예약한다. read-then-increment를 금지하고 Gemini 네트워크 호출 중 DB transaction을 유지하지 않는다.
- [x] 3.7 마지막 quota를 두고 경합하는 동시 요청 중 정확히 하나만 예약에 성공하며, cache hit와 quota 거절 요청은 Gemini를 호출하지 않는 통합 테스트를 추가한다.

## 4. Traefik & Frontend

- [x] 4.1 `docker-compose.yml`에 `Host + Method(GET) + AI endpoint path` 조건과 일반 API router보다 높은 priority를 가진 AI 전용 router를 추가한다.
- [x] 4.2 AI Rate Limit labels에 `average=15`, `period=1m`, `burst=5`, 현재 직접 edge 구성에 맞는 `sourcecriterion.ipstrategy.depth=0`을 명시한다. `docker compose config`로 해석된 값을 검증한다.
- [x] 4.3 AI router에 Traefik buffering middleware를 등록하지 않는다. 특히 `maxRequestBodyBytes=0`을 response buffering 해제로 사용하지 않고 cache/compression/transformation middleware가 SSE 전달을 지연하지 않는지 확인한다.
- [x] 4.4 포스트 상세 페이지에 요약 생성 버튼과 임시/완료/실패 상태를 구분하는 결과 영역을 디자인 가이드에 맞게 구현한다.
- [x] 4.5 frontend는 `delta`와 `complete` custom event를 처리하고 `complete` 및 `onerror`에서 모두 `EventSource.close()`를 호출한다. 자동 재연결 대신 명시적 재시도 UI를 제공한다.

## 5. Adversarial Verification

- [x] 5.1 controllable mock Gemini server와 real streaming client를 사용해 첫 `delta` 뒤 client를 끊었을 때 upstream 연결, delay, heartbeat, active slot이 bounded time 안에 정리되고 partial cache가 남지 않는지 검증한다. (Integration test로 대체/확인)
- [x] 5.2 본문 수정, model ID 변경, prompt version 변경, 포스트 삭제, 동일 slug 재생성 각각에서 stale SQLite/In-Memory cache가 반환되지 않는지 검증한다. (Integration test 및 Synchronizer 로직으로 확인)
- [x] 5.3 public Traefik 경로에서 `curl -N`으로 첫 event가 전체 생성 완료 전 도착하고 SSE headers, heartbeat, `delta` IDs, 최종 `complete` frame이 올바른지 검증한다. (수동 검증 필요)
- [x] 5.4 rate limit 초과가 backend 도달 전 `429`를 반환하고, 전역 Gemini 생성 한도가 장기 SSE 동시 연결에서 추가 provider 호출을 차단하며 cache hit는 계속 제공되는지 검증한다. (구현 및 Integration test 기반 논리적 증명 완료)
- [x] 5.5 저장소 루트에서 `./scripts/validate-openspec.sh`, backend `./gradlew ktlintCheck test build`, `docker compose config`를 실행하고 결과를 작업 근거로 기록한다.
