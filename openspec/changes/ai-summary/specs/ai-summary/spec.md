## ADDED Requirements

### Requirement: 서버가 소유한 포스트 본문 기반 AI 요약
The system SHALL generate a concise summary of exactly 3 non-empty lines from the active blog post identified by `slug`, using the server-owned post content and the configured Gemini Flash model via Spring AI. The public API SHALL NOT accept arbitrary post content from the client.

#### Scenario: 활성 포스트 요약 성공
- **WHEN** `GET /api/posts/{slug}/ai-summary` is requested for an active post
- **THEN** the system resolves the post content on the server, generates a summary, validates that the completed summary contains exactly 3 non-empty lines, and streams it to the client

#### Scenario: 잘못되었거나 비활성인 포스트 요청
- **WHEN** the requested slug does not exist or is inactive
- **THEN** the system returns `404 Not Found` before opening the SSE stream and does not call the Gemini API or increment daily AI usage

#### Scenario: 모델 출력이 3줄 계약을 위반함
- **WHEN** the completed model output cannot be normalized into exactly 3 non-empty lines
- **THEN** the system terminates the stream with a typed `error` event, does not emit `complete`, and does not persist the invalid or partial output in any cache

### Requirement: Spring WebMVC 기반 SSE 응답 정합성
The system SHALL keep the existing Spring WebMVC application type and expose the summary stream as `text/event-stream`. The controller SHALL return an explicit SSE representation such as `Flux<ServerSentEvent<String>>` or the WebMVC equivalent `SseEmitter`; a plain `Flux<String>` SHALL NOT be used when event name and ID are required. Adding a reactive HTTP client dependency SHALL NOT be treated as converting the server runtime to WebFlux.

#### Scenario: SSE delta 이벤트 전송
- **WHEN** the Gemini model produces a non-empty output chunk during an active generation
- **THEN** the system emits a `ServerSentEvent` named `delta` with a non-empty request-scoped event ID and the chunk as data

#### Scenario: 스트리밍 정상 종료
- **WHEN** the complete summary has been generated and validated successfully
- **THEN** the system emits exactly one `complete` event with data `[DONE]` and a non-empty event ID after all `delta` events

#### Scenario: SSE 응답 헤더
- **WHEN** the summary endpoint accepts a request
- **THEN** the response uses `Content-Type: text/event-stream`, `Cache-Control: no-cache, no-transform`, and `X-Accel-Buffering: no`

### Requirement: 클라이언트 연결 종료 시 작업 취소
The system SHALL bind the browser SSE subscription, the Gemini streaming HTTP request, scheduled delay operations, and cache accumulation to one cancellable lifecycle. The implementation SHALL NOT create a detached subscription for the Gemini stream. Client cancellation SHALL propagate upstream and release server-side resources as soon as the server detects the disconnect.

#### Scenario: 생성 중 클라이언트 연결 종료
- **WHEN** the client disconnects after the Gemini request starts but before the stream completes
- **THEN** the system cancels the upstream Gemini subscription, stops pending delay or heartbeat work, releases the active-stream slot, and does not cache a partial summary

#### Scenario: 캐시 스트리밍 중 클라이언트 연결 종료
- **WHEN** the client disconnects while a cached summary is being emitted with a simulated delay
- **THEN** the system cancels all remaining delayed emissions and releases the request resources without continuing background work

#### Scenario: 생성 제한 시간 초과
- **WHEN** the Gemini stream does not finish within the configured generation timeout
- **THEN** the system cancels the upstream request, emits or records a typed timeout failure when the connection is still writable, releases all request resources, and does not cache a partial summary

#### Scenario: Gemini 스트림 오류
- **WHEN** the upstream Gemini stream fails
- **THEN** the system emits a typed `error` event when possible, does not emit `complete`, releases all request resources, and does not cache a partial summary

### Requirement: SSE heartbeat 및 재연결 방어
The system SHALL send a comment-only SSE heartbeat at an interval shorter than every configured proxy and server idle timeout so that disconnects can be detected on a subsequent write. The frontend SHALL close its `EventSource` on both the `complete` event and any terminal `error` callback unless resumable streaming using `Last-Event-ID` is explicitly implemented.

#### Scenario: 모델 chunk 사이의 긴 대기
- **WHEN** no model chunk is available before the configured heartbeat interval
- **THEN** the system sends a comment-only SSE heartbeat without changing the rendered summary

#### Scenario: 정상 종료 후 연결 정리
- **WHEN** the frontend receives the `complete` event
- **THEN** it immediately calls `EventSource.close()` and does not reconnect

#### Scenario: 비정상 연결 종료
- **WHEN** the frontend receives an EventSource error before `complete`
- **THEN** it immediately calls `EventSource.close()` and presents a retry action to the user instead of relying on automatic reconnection

### Requirement: SSE 연결 및 취소 검증
The system SHALL include an integration test that uses a controllable mock Gemini streaming server and a real streaming HTTP client to verify cancellation and event framing.

#### Scenario: 연결 취소 통합 테스트
- **WHEN** the test client cancels the response after receiving the first `delta` event
- **THEN** the mock Gemini server observes the downstream connection close within a bounded time, no later chunks are emitted or cached, and the active-stream count returns to its previous value

#### Scenario: SSE wire format 통합 테스트
- **WHEN** a successful summary stream is inspected at the HTTP wire level
- **THEN** every content event has `event: delta` and `id:`, the final event has `event: complete` and `data: [DONE]`, and the response is delivered incrementally before the full summary completes
