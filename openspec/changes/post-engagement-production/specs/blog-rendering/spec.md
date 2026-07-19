## ADDED Requirements

### Requirement: Server-backed post engagement presentation
시스템은 정적 Markdown article에 서버 DB 기반 반응 projection을 결합해 승인된 피드 지표와 상세 좋아요 버튼을 제공해야 한다(MUST). 게시글 반응에 localStorage 또는 prototype-only state를 사용하면 안 된다(MUST NOT).

#### Scenario: Read-only feed indicators
- **WHEN** feed projection이 성공한다
- **THEN** 각 article은 클릭 동작 없는 `♡ {likeCount} 댓글 {commentCount}`를 표시한다
- **AND** frontend는 해당 page에 한 projection 요청만 사용하고 글별 요청을 만들지 않는다

#### Scenario: Feed projection loading
- **WHEN** feed projection 요청이 진행 중이고 count가 아직 확인되지 않았다
- **THEN** 시스템은 반응 지표 한 줄에만 공간을 예약한 skeleton을 표시하고 count를 `0`으로 가장하지 않는다
- **AND** 제목, 설명, 날짜, tag, thumbnail과 navigation은 즉시 사용할 수 있다
- **AND** 모든 projection page가 완료되면 좋아요와 댓글 count를 함께 표시한다
- **AND** skeleton은 layout shift를 만들지 않고 `prefers-reduced-motion`에서 shimmer를 제거하며 보조기기에서 장식으로 숨겨진다

#### Scenario: Feed projection failure
- **WHEN** projection 요청 또는 응답 검증이 실패한다
- **THEN** 시스템은 count를 0이나 성공 값으로 가장하지 않고 비성공 상태와 재시도 수단을 표시한다
- **AND** 정적 article title, description, navigation과 tag filter는 계속 사용할 수 있다

#### Scenario: Detail like selection and cancellation
- **WHEN** 상세 engagement 조회가 완료된다
- **THEN** 버튼은 본문 끝과 댓글 사이에 외곽선 `♡ 이 글이 도움됐어요 {count}` 또는 mint `♥ 이 글이 도움됐어요 {count}` 상태를 표시한다
- **AND** 최소 높이 48px, `aria-pressed`, native keyboard 동작과 보이는 focus를 제공한다

#### Scenario: Mutation pending and failure
- **WHEN** PUT 또는 DELETE가 진행 중이다
- **THEN** 중복 입력을 막고 성공 응답 전에 count나 pressed 상태를 성공으로 변경하지 않는다
- **WHEN** mutation이 실패한다
- **THEN** 마지막으로 확인된 서버 상태를 유지하고 실패 안내와 재시도를 제공한다

#### Scenario: Stable digit-bucket width
- **WHEN** likeCount가 `0–9`, `10–99`, `100–999`의 같은 자릿수 구간 안에서 바뀐다
- **THEN** 하트와 숫자 영역의 예약 폭으로 버튼 가로 폭이 유지된다
- **AND** 자릿수 경계에서만 필요한 만큼 넓어진다
- **AND** `됐어요`와 숫자 사이의 보이는 공백이 유지된다

#### Scenario: Static export API boundary
- **WHEN** production static export 또는 local Next 개발 화면이 engagement API를 호출한다
- **THEN** 상대 `/api` URL과 same-origin cookie 전달을 사용한다
- **AND** 별도 CORS origin이나 build-time API host를 요구하지 않는다
