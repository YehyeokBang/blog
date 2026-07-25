## Why

AI 요약 기능 수행 시, 실제 요약 텍스트가 스트리밍되기 전까지 약 3~5초의 지연 시간이 발생하고 있습니다. 이 대기 시간 동안 사용자가 페이지가 멈춘 것으로 오해하는 것을 방지하고, 로딩 시간조차 유쾌한 경험으로 전환하기 위해(Premium UX) 진행 상태 메시지 스트리밍을 도입합니다.

## What Changes

- 백엔드(Spring WebFlux): 요약 생성 스트림(AI)과 더미 진행 메시지 스트림(`Flux.interval`)을 `Flux.merge`와 `takeUntilOther`로 결합합니다.
- 백엔드 주도로 1.2초 후부터 SSE(`event: progress`)를 통해 재치 있는 더미 로딩 멘트를 1.2초 간격으로 스트리밍합니다.
- 예외 상황 처리: 캐싱 등으로 실제 AI 응답이 1.2초 이내로 매우 빠르게 도달할 경우, 더미 메시지 스트림을 즉시 취소하여 플라시보 로딩 딜레이 없이 텍스트를 바로 노출합니다(깜빡임 방지).
- 프론트엔드: "요약" 버튼 클릭 직후 0~1.2초 동안은 심플한 스켈레톤 UI를 노출하고, 이후 `progress` 이벤트 수신 시 위로 떠오르는 페이드 인(Fade-In Up) 애니메이션과 함께 메시지를 변경합니다.

## Capabilities

### New Capabilities
- `ai-summary-progress`: AI 요약 대기 시간 동안의 SSE 진행 상태 메시지 발송 및 프론트엔드 상태 전이 처리

### Modified Capabilities

## Impact

- Backend: 기존 AI 요약 스트림을 생성하는 Service 로직(Project Reactor 연산자 체인 수정).
- Frontend: SSE(`EventSource`)에서 `progress`와 `delta` 이벤트 분기 처리 추가 및 로딩/텍스트 컨테이너 CSS 상태 변경.
