## 1. 백엔드 (Spring WebFlux) 로직 구현

- [x] 1.1 AI 요약 응답 스트림의 반환 타입을 일반 String에서 `ServerSentEvent<String>`으로 래핑하고, `event` 타입을 `"delta"`로 지정.
- [x] 1.2 원본 AI 요약 스트림에 API 중복 호출을 막기 위해 `share()` 연산자 적용.
- [x] 1.3 1.2초 간격(`Flux.interval(Duration.ofMillis(1200))`)으로 "문서를 꺼내는 중..." 등의 위트 있는 더미 텍스트를 발행하는 `progress` 이벤트 스트림 구현.
- [x] 1.4 더미 이벤트 스트림에 `takeUntilOther(aiStream)`을 연결하여 실제 응답이 오면 즉시 중단되도록 선언.
- [x] 1.5 두 스트림을 `Flux.merge`로 결합하여 프론트엔드로 반환하는 최종 파이프라인 완성 및 검증.

## 2. 프론트엔드 (JS / CSS) 로직 및 애니메이션 구현

- [x] 2.1 CSS 파일(예: `index.css`)에 로딩 스켈레톤 스타일과 텍스트 `Fade-In Up` 애니메이션(`@keyframes`) 추가.
- [x] 2.2 '요약' 버튼 클릭 직후, 기존 텍스트 대신 스켈레톤 UI가 즉각적으로 노출되도록 초기 상태 로직 수정.
- [x] 2.3 `EventSource`에서 `"progress"` 커스텀 이벤트를 리스닝하여, 수신 시 스켈레톤을 숨기고 텍스트에 애니메이션을 적용하며 상태 렌더링.
- [x] 2.4 `EventSource`에서 `"delta"` 커스텀 이벤트를 리스닝하여, 수신 즉시 progress 상태 UI를 파기하고 실제 요약 데이터 렌더링 시작.
- [x] 2.5 서버 측 에러 발생(`onerror`) 시를 대비한 예외 UI 노출 및 `EventSource.close()` 에러 핸들링 추가.
