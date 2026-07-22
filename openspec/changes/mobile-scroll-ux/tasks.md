## 1. Approval and baseline gate

- [x] 1.1 `proposal.md`, `design.md`, `specs/scroll-navigation/spec.md`와 이 작업표를 함께 검토·승인하고, 승인 전에는 `frontend/` 제품 코드를 변경하지 않는다.
- [x] 1.2 작업 시작 시 `git status --short --branch`, `./scripts/validate-openspec.sh`, `cd frontend && npm run test:engagement && npm run lint`를 실행해 기존 branch와 baseline 결과를 기록한다.

## 2. Scroll decision TDD foundation

- [x] 2.1 `frontend/lib/scroll-ux.test.ts`를 먼저 만들고 raw distance `-1/0/71/72`, 0.55 resistance, 96px clamp, reduced-motion behavior, TOC fit boundary `viewportHeight - 120`의 실패 test를 작성한다.
- [x] 2.2 `cd frontend && node --test --experimental-strip-types lib/scroll-ux.test.ts`가 예상한 missing module/function으로 실패하는지 확인한 뒤 `frontend/lib/scroll-ux.ts`에 `PULL_REFRESH_THRESHOLD_PX`, `PULL_REFRESH_MAX_OFFSET_PX`, `PullRefreshPhase`, `PullRefreshState`, `getPullVisualOffset`, `getPullRefreshPhase`, `getScrollBehavior`, `shouldStickToc`를 최소 구현한다.
- [x] 2.3 새 unit test와 기존 `frontend/lib/engagement.test.ts`를 함께 통과시키고 `frontend/package.json`에 두 suite를 명시적으로 실행하는 `test:scroll-ux` 또는 통합 `test` script를 추가한다.

## 3. Fixed header and progressive pull-to-refresh

- [x] 3.1 `frontend/components/PullToRefresh.tsx`를 추가해 `CSS.supports("overscroll-behavior-y", "contain")`, `matchMedia("(pointer: coarse)")`와 `navigator.maxTouchPoints > 0`을 모두 만족할 때만 root data attribute와 gesture listener를 활성화한다.
- [x] 3.2 같은 component에 native `touchstart/touchmove/touchend/touchcancel` lifecycle을 구현하고, activation 전 upward·horizontal·multi-touch는 native에 위임하며 root top·single downward vertical·non-interactive start에서만 pulling한다. activation 후 방향 변경·multi-touch는 reload 없이 current custom gesture를 종료하고 다음 gesture부터 native를 허용한다.
- [x] 3.3 move update를 단일 `requestAnimationFrame`으로 coalesce하고 active content에 resistance가 적용된 `translate3d`만 사용하며, incomplete/cancel은 idle 복귀 후 inline transform·will-change를 제거한다. armed release는 `refreshing` DOM commit 후 effect가 예약한 animation-frame callback에서 `reloadStartedRef`를 설정하고 `window.location.reload()`를 호출하며 cleanup으로 Strict Mode 중복 frame을 취소한다.
- [x] 3.4 `PullRefreshIndicator`의 `idle → pulling → armed → refreshing` text, `role="status"`, polite live region, busy state와 focus 비간섭을 구현하고 reduced motion에서 spring·spinner·transition만 제거한다.
- [x] 3.5 `frontend/app/layout.tsx`에서 header를 viewport top의 fixed 60px layer로 바꾸고 global `BackToTopButton`을 비변환 sibling으로, `<main>`·`<footer>`만 `PullToRefresh`의 transformable surface로 조립해 기존 flex footer layout과 정확한 60px content offset을 유지한다.
- [x] 3.6 `frontend/app/globals.css`에 enabled root의 `overscroll-behavior-y: contain`, pull surface/indicator와 reduced-motion rule을 추가하고 header 조상에는 fixed containing block을 바꾸는 transform/filter/will-change가 없음을 검사한다.
- [ ] 3.7 touch-capable local browser automation에서 71px cancel, 72px armed, 단일 document navigation reload, header geometry, activation 전후 multi-touch/cancel, interactive target와 code scroll 제외를 재현하고 phase/offset DOM 상태와 console/network 근거를 기록한다.

## 4. Brand home and detail top navigation

- [x] 4.1 `frontend/components/HeaderHomeLink.tsx`를 추가해 다른 route에서는 `Link href="/" scroll={true}`로 이동하고, root에서는 `URLSearchParams`의 `tag`만 삭제해 다른 query를 보존한 URL을 `router.replace(..., { scroll: false })`한 뒤 top으로 이동하며 already-top에서는 중복 animation을 만들지 않는다.
- [x] 4.2 `HeaderHomeLink`가 `getScrollBehavior`를 사용해 기본 `smooth`, reduced motion `auto`를 적용하도록 하고 `frontend/app/layout.tsx`의 기존 brand Link만 이 component로 교체한다.
- [x] 4.3 게시글 metadata header에 `id="article-header"`를 추가하고 RootLayout의 비변환 sibling `frontend/components/BackToTopButton.tsx`가 `/posts/` route에서만 IntersectionObserver로 이 header를 관찰해 fixed header 위로 사라졌을 때 `↑ 위로` native button을 표시하게 한다.
- [x] 4.4 IntersectionObserver 미지원 fallback을 passive scroll listener와 requestAnimationFrame으로 구현하고, activation이 top `0` 이동·motion preference·focus 비강탈 계약을 따르게 한다.
- [x] 4.5 `frontend/app/globals.css`에 top `68px`, `z-index: 40`, `88×44px`의 `subtle floating glass surface`를 light/dark 수치대로 구현한다. `@supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)))`와 그 전체 조건을 부정한 불투명 fallback, 88%/90% hover, pressed/focus-visible/reduced-motion/forced-colors 상태를 추가한다.
- [ ] 4.6 375×812와 1280×720의 light/dark에서 article header 전후 visibility, `↑ 위로` 위치·label·keyboard activation, 4.5:1 text와 3:1 focus 대비, backdrop 지원/fallback, scroll 중 geometry와 console error를 검증한다. thumbnail, 일반 본문, code/table 위를 각각 배경 fixture로 사용한다.

## 5. Fully visible TOC without nested scrolling

- [ ] 5.1 기존 TOC test fixture 또는 `scroll-ux.test.ts`에서 TOC가 available height와 같을 때 sticky이고 1px 클 때 non-sticky인 test를 먼저 실패시킨 뒤 `shouldStickToc` 결과를 고정한다.
- [ ] 5.2 `frontend/components/TOC.tsx`에 required `variant: "inline" | "sidebar"`를 추가하고 공통 nav에서 `max-height`, `overflow-y-auto`, `custom-scrollbar`와 right padding을 제거하되 heading extraction, active section과 click lock은 변경하지 않는다. heading click은 `getScrollBehavior`로 기본 smooth, reduced motion auto를 사용한다.
- [ ] 5.3 inline variant는 항상 normal flow, sidebar variant는 ResizeObserver·window resize로 실제 높이를 측정해 fit할 때만 `sticky top-[100px]`가 되게 하고 초기/미지원 상태는 non-sticky로 둔다.
- [ ] 5.4 `frontend/app/posts/[slug]/page.tsx`의 mobile·desktop 호출부에 각각 `inline`·`sidebar` variant를 전달하고 기존 desktop sticky wrapper를 제거한다.
- [ ] 5.5 `frontend/app/globals.css`의 TOC custom scrollbar rule을 삭제하고 긴 mobile/desktop 목차에서 모든 h1·h2 item이 DOM에 존재하며 TOC 내부 wheel/touch scroll 없이 document scroll로 마지막 item까지 접근 가능한지 검증한다.

## 6. Documentation and automated verification

- [ ] 6.1 `docs/design.md`의 header, 상세, 반응형 동작을 fixed global header, progressive pull-to-refresh, brand/top navigation, conditional sticky TOC와 subtle glass/fallback 계약으로 갱신한다.
- [ ] 6.2 `cd frontend && npm run test:engagement && npm run test:scroll-ux && npm run lint`를 실행하고 모든 command가 exit 0인지 확인한다.
- [ ] 6.3 `cd frontend && NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build`를 실행해 Next.js 16 static export가 성공하고 새 client component가 server-rendered page build를 깨지 않는지 확인한다.
- [ ] 6.4 저장소 root에서 `./scripts/validate-openspec.sh`, `node --test scripts/check-documentation.test.mjs`, `node scripts/check-documentation.mjs`를 실행해 strict OpenSpec과 문서 link 검사를 통과한다.
- [ ] 6.5 gstack `/browse`로 375×812, 1280×720의 목록·상세·소개를 light/dark 및 keyboard로 확인하고 fixed header, home filter reset/top, top control, TOC, focus, fallback과 console/network error를 검증한다. PR 검증 기록에는 page, viewport, theme, input, browser version, pass/fail과 screenshot 또는 console/network 근거를 표로 남긴다.

## 7. Actual iOS Safari release gate

- [ ] 7.1 실제 iOS Safari의 목록·상세·소개에서 root pull 중 header top `0px`·height `60px`, content-only movement와 custom/native indicator 비중복을 확인한다.
- [ ] 7.2 실제 iOS Safari에서 armed 문구 전 release의 cancel, armed 문구 후 reload, normal 양방향 scroll, horizontal back/forward swipe, link/button tap, code horizontal scroll, multi-touch, pinch zoom과 touchcancel 회귀가 없음을 확인한다. 71px/72px numeric boundary는 unit test, reload 1회는 Safari Web Inspector의 단일 document navigation request 기록을 근거로 사용한다.
- [ ] 7.3 iOS의 Reduce Motion과 VoiceOver에서 motion 제거, 세 상태 text의 polite announcement와 focus 비강탈을 확인한다. 하나라도 미충족이면 이 change의 release를 중단하고 수정 전 main의 native refresh를 유지한다.

## 8. Completion gate

- [ ] 8.1 tasks와 구현·unit/browser/iOS 근거를 항목별 대조하고 실제 근거가 있는 task만 완료 표시한다.
- [ ] 8.2 strict validation 뒤 `scroll-navigation` delta를 `openspec/specs/scroll-navigation/spec.md` base spec에 동기화하고 `openspec/README.md`의 Base specs에 link를 추가한 뒤 strict validation과 문서 검사를 다시 통과한다.
- [ ] 8.3 production 반영 후 fixed header, reload, home/top navigation과 TOC에 회귀가 없는지 확인하고 rollback 대상 commit을 기록한다.
- [ ] 8.4 모든 자동·실기기·운영 조건이 충족된 경우에만 strict validation을 다시 실행하고 `mobile-scroll-ux` change를 archive한다. 실제 iOS gate가 하나라도 실패하면 배포·base 동기화·archive를 중단하고 기존 native refresh를 유지한다.
