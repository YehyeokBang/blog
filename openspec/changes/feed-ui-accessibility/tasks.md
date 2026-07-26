## 1. Approval gate

- [x] 1.1 proposal, design, `blog-rendering` delta spec과 tasks를 검토·승인한다.
- [x] 1.2 승인 전에는 frontend 제품 코드를 변경하지 않는다.

## 2. Feed UI implementation

- [x] 2.1 `hasHorizontalOverflow({ scrollWidth, clientWidth, scrollLeft })`의 no-overflow, right-edge, `+1px` boundary test를 먼저 작성한다.
- [x] 2.2 상단 가로 tag filter 목록의 mount, resize, scroll에서 overflow 상태를 갱신하고 조건부·비차단 우측 단서를 구현한다.
- [x] 2.3 카드의 tag 이외 영역을 하나의 상세 link로 만들고, nested anchor 없이 card tag filter link의 독립 이동을 유지한다.
- [x] 2.4 mobile 썸네일의 글 정보 위 가로 배치와 `sm` 이상 우측 배치를 구현한다.
- [x] 2.5 상단 filter, 상세 card, card tag link에 primary `focus-visible` 표시를 추가한다.

## 3. Verification and completion gate

- [x] 3.1 `cd frontend && npm run test:feed-ui && npm run lint && NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`를 통과한다.
- [x] 3.2 mobile(`sm` 미만)과 `sm` 이상, pointer·keyboard, tag overflow 유무와 right edge를 browser에서 확인한다.
- [x] 3.3 `./scripts/validate-openspec.sh`, `node --test scripts/check-documentation.test.mjs`, `node scripts/check-documentation.mjs`를 실행하고 결과를 기록한다.
  - `feed-ui-accessibility` strict validation은 통과했다.
  - 전체 검증은 기존 `ai-summary-progress` Purpose 누락과 OpenSpec README의 AI spec 인덱스 누락으로 실패했다.
- [ ] 3.4 구현·테스트 근거를 대조한 뒤에만 delta를 base spec에 동기화하고 change 종료 절차를 진행한다.
  - delta는 base spec에 동기화했다. 기존 전체 검증 실패가 해소될 때까지 archive는 보류한다.
