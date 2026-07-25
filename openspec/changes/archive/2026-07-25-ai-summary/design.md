## Context

블로그 포스트의 3줄 요약은 독자의 탐색 비용을 줄이지만, Gemini 무료 티어의 호출 한도와 장시간 SSE 연결을 함께 다뤄야 합니다. 현재 backend는 Spring Boot WebMVC, Tomcat, JPA, SQLite를 사용하며 Traefik이 `/api/*`를 backend로 직접 라우팅합니다. 이 change는 전체 서버를 WebFlux로 전환하지 않고, Spring AI의 reactive stream을 WebMVC의 비동기 응답 지원에 연결합니다.

현재 backend의 `posts.json`은 slug만 포함하므로 본문 기반 요약과 캐시 무효화를 지원할 수 없습니다. build 시 backend manifest에 서버가 사용할 정규화된 요약 입력과 그 SHA-256 hash를 함께 생성해야 합니다.

## Goals / Non-Goals

**Goals:**
- Spring AI Google GenAI starter와 Gemini Flash를 연결하고 정확히 3줄로 검증된 요약을 SSE로 제공합니다.
- 클라이언트 disconnect, timeout, upstream 오류가 Gemini stream과 예약 작업의 취소로 전파되도록 합니다.
- 본문, 모델, 프롬프트 변경을 감지하는 In-Memory + SQLite 캐시를 적용합니다.
- Traefik Rate Limit, 애플리케이션 동시 생성 제한, SQLite 일일 quota로 비용과 리소스를 방어합니다.
- 실제 public Traefik 경로에서 SSE가 점진적으로 전달되는지 검증합니다.

**Non-Goals:**
- backend 전체를 WebFlux 또는 R2DBC로 전환
- OpenAI, Anthropic 등 다중 LLM provider 추상화
- 복잡한 사용자 인증/인가 또는 CAPTCHA 도입
- `Last-Event-ID` 기반 중단 지점 재개

## Decisions

### 1. WebMVC를 유지하고 명시적인 SSE 객체를 반환

- `spring-boot-starter-webmvc`를 유지하고 서버 application type을 `SERVLET`로 고정합니다.
- Google GenAI starter가 제공하는 `Flux<ChatResponse>`를 사용하되, WebFlux server 전환을 목적으로 `spring-boot-starter-webflux`를 추가하지 않습니다. 실제 의존성은 Gradle dependency report로 확인하고 필요한 최소 의존성만 version catalog에 선언합니다.
- Controller는 `GET /api/posts/{slug}/ai-summary`에서 `Flux<ServerSentEvent<String>>`를 반환합니다. 평문 `Flux<String>`은 `event`, `id`, comment heartbeat를 명시할 수 없으므로 사용하지 않습니다.
- content event는 `delta`, 정상 종료 event는 `complete`, 종료 data는 `[DONE]`으로 고정합니다. 각 content/complete event에는 request-scoped ID를 포함합니다.
- Spring MVC가 reactive multi-value 응답을 지원하더라도 실제 Servlet response write는 blocking이므로 production용 bounded `AsyncTaskExecutor`와 async timeout을 명시합니다.

### 2. 하나의 취소 가능한 stream lifecycle 유지

- Controller가 반환하는 Flux부터 Gemini stream, 출력 누적, heartbeat, 캐시 hit의 `delayElements`까지 하나의 subscription chain으로 연결합니다. Service 내부에서 detached `subscribe()`를 호출하지 않습니다.
- client cancellation은 upstream에 전파되어 Gemini HTTP 응답 소비, 남은 delay, heartbeat 및 active generation slot을 정리합니다. HTTP cancellation은 원격 provider가 이미 시작한 과금 또는 연산까지 취소한다고 보장하지 않으므로, 서버 측 자원 해제와 추가 데이터 소비 중단을 보장 범위로 둡니다.
- `timeout`, `doOnCancel`, `doFinally`를 사용해 timeout, cancellation, complete, error 경로 모두에서 idempotent cleanup을 수행합니다.
- Servlet API는 disconnect를 즉시 알려주지 않으므로 proxy/server idle timeout보다 짧은 주기의 comment-only heartbeat를 보냅니다.
- frontend는 `complete`와 `onerror` 모두에서 `EventSource.close()`를 호출합니다. 자동 재연결 대신 사용자가 명시적으로 재시도합니다.
- 전체 출력이 정상 완료되고 정확히 3개의 비어 있지 않은 줄로 검증된 경우에만 캐시에 저장합니다. 오류, timeout, cancellation, 형식 위반 결과는 캐시하지 않습니다.

### 3. 본문 버전 기반 2계층 캐시와 single-flight

- build manifest는 `slug`, 정규화된 요약 입력 또는 서버가 해석할 수 있는 content reference, 그 입력의 `contentHash`를 포함합니다.
- `ai_summary`는 `slug`를 PK로 사용하고 `content_hash`, `model_id`, `prompt_version`, `summary`, `updated_at`을 저장합니다. PK가 이미 index이므로 별도의 단일 `slug` index는 만들지 않습니다.
- cache hit는 `slug`, `contentHash`, `modelId`, `promptVersion`이 모두 일치할 때만 인정합니다. 불일치 row는 stale로 처리하고 성공한 새 요약으로 교체합니다.
- manifest 동기화 시 삭제되거나 inactive가 된 slug의 SQLite 및 In-Memory cache를 무효화합니다. In-Memory key도 동일한 네 가지 version 요소를 포함합니다.
- 동일 cache version의 동시 miss는 single-flight로 하나의 Gemini 요청과 하나의 quota 예약을 공유합니다. 일부 subscriber만 취소되면 생성은 유지하고, 모든 subscriber가 취소되면 upstream을 취소합니다.

### 4. 조건부 원자 연산으로 일일 quota 예약

- `ai_daily_usage`는 명시된 timezone 기준 `usage_date`와 `usage_count`를 저장합니다.
- cache miss가 single-flight owner가 된 경우에만 quota를 예약합니다.
- quota 예약은 `INSERT ... ON CONFLICT DO UPDATE ... WHERE usage_count < :limit RETURNING usage_count` 형태의 단일 조건부 원자 statement로 처리합니다. read-then-update를 사용하지 않습니다.
- Gemini 네트워크 호출 동안 SQLite transaction을 열어두지 않습니다.
- quota 예약 후 provider 호출이 실패한 경우에도 보수적으로 사용량을 되돌리지 않습니다. 실제 provider 요청 여부를 확실하게 판별하기 어렵고 rollback 경쟁을 추가하기 때문입니다.

### 5. Traefik은 요청 속도를, backend는 생성 동시성을 제한

- AI 전용 router는 `Host`, `Method(GET)`, AI endpoint path를 명시하고 일반 `/api` router보다 높은 priority를 사용합니다.
- Rate Limit은 `average=15`, `period=1m`, `burst=5`를 명시합니다. `average`만 두어 기본 `period=1s`가 적용되는 상황을 허용하지 않습니다.
- 현재 배포는 public Traefik이 최초 edge이므로 source criterion은 connection RemoteAddr인 `ipStrategy.depth=0`을 사용합니다. Cloudflare 등 trusted proxy가 추가되면 신뢰할 proxy와 실제 `X-Forwarded-For` hop 순서를 운영 환경에서 확인한 후 depth 또는 excluded IP를 별도 change로 설정합니다. 임의로 `depth=1`을 선반영하지 않습니다.
- Rate Limit은 장시간 연결 수와 cache miss 생성 수를 제한하지 못하므로 backend에 작은 전역 active Gemini generation limit을 둡니다. cache hit는 이 생성 limit을 소비하지 않습니다.

### 6. Traefik buffering middleware를 사용하지 않음

- Traefik의 `maxRequestBodyBytes=0`은 request body 무제한을 뜻하며 SSE response buffering 해제가 아닙니다. AI router에 buffering middleware를 등록하지 않습니다.
- backend는 `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`를 반환합니다.
- 현재 API 경로는 frontend Nginx를 통과하지 않습니다. 향후 Nginx가 경로에 추가되면 해당 location에 `proxy_buffering off`를 설정하거나 backend의 `X-Accel-Buffering: no`를 존중하도록 합니다.
- SSE router에는 응답 전달을 지연할 수 있는 cache, buffering, transformation middleware를 적용하지 않습니다.

## Risks / Trade-offs

- **Spring MVC blocking write**: reactive upstream이어도 Servlet response write는 blocking입니다. bounded async executor, active stream metric, timeout으로 용량을 제한합니다.
- **disconnect 감지 지연**: Servlet은 remote disconnect를 즉시 통지하지 않습니다. heartbeat write와 통합 취소 테스트로 감지 및 cleanup을 검증합니다.
- **EventSource의 HTTP status 제한**: native EventSource는 429 response detail을 노출하지 않습니다. frontend는 범용 오류와 명시적 재시도 UX를 제공하고 자동 재연결하지 않습니다.
- **quota 예약 후 provider 실패**: 보수적으로 quota를 소비합니다. 무료 quota 보호를 정확한 성공 호출 수보다 우선합니다.
- **정확히 3줄과 실시간 표시의 긴장**: delta는 생성 중 표시할 수 있지만 최종 3줄 검증 실패 시 이미 표시된 임시 텍스트를 성공 결과로 확정해서는 안 됩니다. frontend는 `complete`를 받은 경우에만 결과를 성공 상태로 확정하고, `error`에서는 임시 내용을 폐기합니다.
