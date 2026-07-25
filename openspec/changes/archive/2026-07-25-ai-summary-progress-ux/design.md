## Context

AI 요약(Gemini) 호출은 보통 3~5초의 지연 시간이 발생합니다. 이 대기 시간 동안 사용자에게 무응답 상태로 느껴질 수 있으므로 백엔드에서 일정 간격으로 진행 상태(더미) 메시지를 스트리밍해야 합니다. 
핵심은 딜레마의 해결입니다. 캐시 등으로 응답이 매우 빠를 경우(1초 이내) 오히려 더미 메시지를 띄우면 깜빡임(Flickering)과 불필요한 인위적 지연이 발생합니다. 따라서 "빠를 땐 텍스트만 곧바로", "느릴 땐 일정 시간 경과 후 진행 메시지 표시"라는 UX 요구사항을 만족해야 합니다.

## Goals / Non-Goals

**Goals:**
- AI 응답 지연 시(1.2초 이상) 위트 있는 진행 상태 메시지를 SSE를 통해 1.2초 간격으로 스트리밍.
- AI 응답이 빠를 시(1.2초 이내) 진행 상태 스트림 방출을 사전에 차단(Cancel)하여 UI 깜빡임 방지.
- 프론트엔드에서 버튼 클릭 직후 스켈레톤 UI를 띄우고 `progress` 이벤트 수신 시 Fade-In Up 텍스트로 자연스럽게 트랜지션.

**Non-Goals:**
- 실제 AI 서버의 내부 처리 상태를 완벽히 동기화하여 보여주는 것 (더미 타이머 이벤트로 대체하여 단순화).
- WebSocket이나 Socket.io 도입 (단방향 스트리밍이므로 SSE로 충분함).

## Decisions

1. **Project Reactor 스트림 제어 (`Flux.interval` & `takeUntilOther`)**
   - **Rationale:** Spring WebFlux 환경에서 `progressStream`과 `aiStream`을 생성하고 `Flux.merge`로 병합합니다. `progressStream`에는 `takeUntilOther(aiStream)`을 적용합니다. 
   - **UX 매직:** `Flux.interval(1.2s)`는 첫 방출을 1.2초 후에 하므로, `aiStream`이 1.2초 이내에 도착하면 `takeUntilOther`가 발동해 더미 스트림이 한 번도 방출되지 않고 종료됩니다. 추가적인 if 로직 없이 '지연 로딩 인디케이터(Delayed Loading Indicator)' UX를 선언적으로 달성합니다.
   - **API 중복 호출 방지:** `aiStream`에 `share()`(또는 `publish().refCount(1)`) 연산자를 적용하여, `takeUntilOther`와 `merge`가 구독할 때 원본 AI 스트림을 공유하게 만들어 중복 API 호출을 방지합니다.

2. **SSE 커스텀 이벤트 타입 사용 (`event: progress` vs `event: delta`)**
   - **Rationale:** 프론트엔드(`EventSource`)가 별개의 이벤트 리스너로 진행 상태와 실제 데이터를 명확히 분기 처리하도록 표준 SSE `event` 필드를 정의합니다.

3. **프론트엔드 트랜지션 (Skeleton -> Progress -> Result)**
   - **Rationale:** 초기엔 빈 뼈대 UI를 노출하고, `progress` 이벤트가 오면 CSS `Fade-In Up` 애니메이션으로 메시지를 교체합니다. `delta` 이벤트가 오면 progress UI를 완전히 숨깁니다.

## Risks / Trade-offs

- **더미 메시지 고갈 리스크:** AI 응답이 예상보다 매우 지연(예: 10초 이상)되어 준비된 더미 메시지가 고갈될 수 있습니다.
  - **Mitigation:** 메시지 목록이 고갈될 경우 `repeat()` 연산자를 사용해 사이클을 반복하게 하거나, 마지막 메시지("조금 더 깊이 고민하고 있습니다...")를 반복 출력하도록 구성.
- **에러 파급 처리:** AI 서버 에러 발생 시 UI 피드백.
  - **Mitigation:** `share()`된 `aiStream`의 `onError` 시그널이 `merge`를 통해 전달되므로, 클라이언트 측 `EventSource.onerror`에서 에러 UI를 띄우고 `close()` 처리.
