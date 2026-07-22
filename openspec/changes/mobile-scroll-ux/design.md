## Context

2026-07-22 기준 공통 shell의 header는 `frontend/app/layout.tsx`에서 `sticky top-0`이고 문서 root와 같은 scroll surface에 있다. 제공된 772×1680, 9.57초 모바일 녹화에서는 native pull-to-refresh가 시작될 때 header까지 콘텐츠와 함께 아래로 이동한다. `Yehyeok`은 일반 `Link href="/"`이므로 이미 목록 route에 있을 때 filter 초기화와 smooth top 이동을 명시적으로 보장하지 않는다.

상세 화면은 mobile inline TOC와 desktop sticky TOC에 같은 `TOC`를 사용한다. `frontend/components/TOC.tsx`의 `max-h-[calc(100vh-120px)] overflow-y-auto`와 custom scrollbar 때문에 긴 목차가 문서 scroll 안에 별도 scroll surface를 만든다. 상세 화면에는 article header가 사라진 뒤 top으로 복귀할 control이 없다.

frontend는 Next.js 16 static export이며 backend round trip 없이 정적 document를 제공한다. 새로고침은 route cache refresh가 아니라 browser document reload여야 한다. 새 dependency와 backend 변경 없이 React client component, CSS capability detection과 기존 token만 사용한다.

## Goals / Non-Goals

**Goals:**

- 목록, 상세, 소개의 60px header를 pull gesture와 무관한 viewport 기준점으로 유지한다.
- 지원되는 coarse touch browser에서 root top pull의 진행, 승인 임계점과 refreshing 상태를 명확히 보여준 뒤 실제 document reload를 실행한다.
- 미지원 browser와 제외 대상 interaction의 native behavior를 보존한다.
- brand home, 상세 top control과 TOC가 긴 문서에서 예측 가능한 상단 이동·section navigation을 제공한다.
- light/dark, keyboard, assistive technology, reduced motion과 backdrop filter fallback을 포함한다.
- 순수 상태 결정은 Node test로, browser integration은 Chromium과 실제 iOS Safari로 검증할 수 있게 경계를 나눈다.

**Non-Goals:**

- native pull-to-refresh를 지원하지 않는 모든 browser에 touch interception을 강제하는 polyfill
- `router.refresh()` 또는 API별 재요청으로 document reload를 흉내 내는 동작
- list rendering, tag 목록, post ordering, engagement loading 또는 article content 변경
- scroll progress bar, gesture haptic feedback, service worker, offline cache
- Apple platform material의 굴절 shader, dynamic reflection 또는 shape morphing 복제

## Decisions

### 1. Global shell은 fixed header와 변환 가능한 content sibling으로 분리한다

`frontend/app/layout.tsx`의 header는 `fixed inset-x-0 top-0 z-50 h-[60px]`가 되고 body 또는 global content shell이 정확히 60px의 top offset을 예약한다. `PullToRefresh` client component는 `<main>`과 `<footer>`를 하나의 content surface로 감싸되 header는 감싸지 않는다. pull 중 transform은 이 content surface에만 적용하고 header 또는 그 조상에는 `transform`, `perspective`, `filter`, `will-change: transform`을 적용하지 않는다.

구조는 다음 책임 경계를 사용한다.

```text
RootLayout (server)
├─ fixed header
│  ├─ HeaderHomeLink (client)
│  └─ existing navigation/theme controls
├─ BackToTopButton (client, viewport overlay인 비변환 sibling)
└─ PullToRefresh (client, body의 60px offset 이후)
   ├─ PullRefreshIndicator (component 내부)
   └─ transformable content surface
      ├─ main → route content
      └─ footer
```

`PullToRefresh`가 server-rendered `children`을 prop으로 받는 것은 children 자체를 client rendering으로 바꾸지 않는다. content surface는 기존 `main.flex-1`과 footer 위치를 보존하도록 `flex min-h-[calc(100vh-60px)] flex-col` contract를 갖는다.

대안인 `sticky` 유지와 native gesture 수용은 영상의 header 이동을 해결하지 못해 제외한다. header와 content를 함께 transform하는 방식도 안정된 기준점을 잃으므로 제외한다.

### 2. Pull-to-refresh는 capability-gated touch state machine이다

새 `frontend/lib/scroll-ux.ts`는 DOM을 직접 변경하지 않는 다음 contract를 제공한다.

```ts
export const PULL_REFRESH_THRESHOLD_PX = 72;
export const PULL_REFRESH_MAX_OFFSET_PX = 96;

export type PullRefreshPhase = "idle" | "pulling" | "armed" | "refreshing";

export interface PullRefreshState {
  phase: PullRefreshPhase;
  startY: number | null;
  rawDistance: number;
  visualOffset: number;
}

export function getPullVisualOffset(rawDistance: number): number;
export function getPullRefreshPhase(rawDistance: number): "pulling" | "armed";
export function getScrollBehavior(reducedMotion: boolean): ScrollBehavior;
export function shouldStickToc(contentHeight: number, viewportHeight: number): boolean;
```

`getPullVisualOffset`은 음수를 0으로 clamp하고 양수에 0.55 resistance를 적용한 뒤 96px에서 clamp한다. phase는 raw downward distance가 72px 미만이면 `pulling`, 72px 이상이면 `armed`다. 상수는 configuration으로 노출하지 않는다.

`PullToRefresh`는 client mount 뒤 아래 조건을 모두 만족할 때만 `enabled`가 된다.

- `CSS.supports("overscroll-behavior-y", "contain")`
- `window.matchMedia("(pointer: coarse)").matches`
- `navigator.maxTouchPoints > 0`

enabled 동안 document root에 `data-pull-refresh="enabled"`를 설정하고 CSS는 그 상태에서만 `overscroll-behavior-y: contain`을 적용한다. unmount 때 attribute를 제거한다. horizontal overscroll 속성은 바꾸지 않는다.

gesture listener는 transformable content surface에 직접 native event로 등록한다. `touchmove`만 `{ passive: false }`이고, `touchstart`, `touchend`, `touchcancel`은 passive listener다. document 전체에 permanent non-passive listener를 두지 않는다.

gesture start 조건은 다음을 모두 만족해야 한다.

- `window.scrollY === 0`
- 정확히 한 touch
- 시작 target이 `a`, `button`, `input`, `textarea`, `select`, `[contenteditable]`, `pre`, `[data-pull-refresh-ignore]` 또는 내부 `overflow: auto|scroll` ancestor 안이 아님

첫 move가 downward vertical gesture(`deltaY > 0`, `abs(deltaY) > abs(deltaX)`)일 때만 pulling을 시작하고 그 move부터 `preventDefault()`를 호출한다. custom activation 전의 upward, horizontal, multi-touch, `scrollY > 0`과 제외 target은 native behavior에 그대로 위임한다. activation 후 같은 touch가 방향을 바꾸거나 multi-touch가 되면 custom offset을 0으로 복귀시키고 reload 없이 종료한다. 이미 `preventDefault()`가 호출된 현재 touch의 native scroll/zoom 재개는 보장하지 않으며 다음 새 gesture부터 native behavior를 다시 허용한다. `touchcancel`도 같은 cancel 경로를 사용한다. refresh 중 추가 입력은 무시한다.

move update는 `requestAnimationFrame` 하나로 coalesce한다. active pull에서 content에는 `translate3d(0, visualOffset, 0)`만 적용하고, surface ref의 inline style과 indicator ref의 CSS custom property `--pull-progress`를 직접 갱신한다. raw distance·offset 변화마다 React state로 `children` wrapper를 재-render하면 안 된다. React state는 status text가 바뀌는 `idle`/`pulling`/`armed`/`refreshing` phase 경계에서만 갱신한다. layout height/top과 blur 값을 frame마다 변경하지 않는다. release가 `armed`면 phase를 `refreshing`으로 바꾼다. `phase === "refreshing"`의 post-commit `useEffect`는 다음 animation frame을 예약하고, callback 안에서 `reloadStartedRef`가 false일 때만 true로 바꾼 직후 `window.location.reload()`를 호출한다. effect cleanup은 예약 frame을 취소하므로 React Strict Mode의 effect 재실행에서도 reload 1회를 보장하고 indicator DOM이 먼저 commit된다. release가 `pulling`이면 offset을 0으로 복귀시킨 뒤 `idle`로 돌아간다. idle에서는 content의 inline `transform`과 `will-change` property를 제거해 computed transform이 `none`이 되게 한다. `translate3d(0, 0, 0)`을 idle style로 남기면 안 된다.

indicator는 `PullToRefresh`가 반환하는 transformable content surface의 비변환 fixed sibling으로 header 바로 아래에 둔다. supported browser에서는 idle에도 DOM을 유지하되 CSS로 hidden 처리해 반복 pull/release가 children tree를 mount/unmount하지 않게 한다. text 왼쪽에 28px SVG progress ring을 두며 `pulling`과 `armed` ring의 fill은 `clamp(rawDistance / 72, 0, 1)`이고 72px에서 완전히 찬다. `refreshing`은 full ring을 유지하고 rotation으로 전환한다. ring은 focusable하지 않고 text live region을 대체하지 않는다. 다음 text contract를 사용한다.

| Phase | Visible text | Assistive state |
|---|---|---|
| `idle` | 숨김 | announcement 없음 |
| `pulling` | `아래로 당겨 새로고침` | `role="status"`, 상태 진입 시 한 번 |
| `armed` | `놓으면 새로고침` | 상태 진입 시 한 번 |
| `refreshing` | `새로고침 중` | `aria-live="polite"`, `aria-busy="true"` |

`prefers-reduced-motion: reduce`에서는 spring, ring rotation과 state transition을 제거하되 손가락을 따르는 위치 피드백, static ring fill과 text state는 유지한다.

지원 조건을 만족하지 않으면 data attribute, indicator, transform과 touch listener를 활성화하지 않는다. native pull-to-refresh가 그대로 fallback이다. 이는 구형 iOS까지 document-level interception을 강제하는 대안보다 일반 scroll, link click과 pinch zoom 회귀 위험이 낮다.

### 3. Brand home은 route와 filter 상태에 따라 명시적으로 동작한다

`frontend/components/HeaderHomeLink.tsx`는 기존 brand Link를 대체한다.

- 현재 pathname이 `/`가 아니면 명시적 `scroll={true}`인 Next `Link href="/"` navigation을 사용하고 새 page는 top에서 시작한다.
- 현재 pathname이 `/`이면 click default를 막고 `URLSearchParams`에서 `tag` key만 삭제한다. 남은 query가 없으면 `router.replace("/", { scroll: false })`, 다른 query가 있으면 `router.replace("/?${params.toString()}", { scroll: false })`를 사용한 뒤 document top으로 이동한다.
- current scroll이 0이면 추가 animation을 시작하지 않는다.
- motion preference가 reduce가 아니면 `window.scrollTo({ top: 0, behavior: "smooth" })`, reduce면 `behavior: "auto"`를 사용한다.

filter 유지 대안은 brand home이 site root를 복원한다는 일반 기대와 현재 tag별 짧은 목록에서 얻는 이점이 작아 제외한다. article card/tag Link 동작은 변경하지 않는다.

### 4. 상세 top control은 article header visibility로 노출을 결정한다

상세 article metadata header에 안정적인 `id="article-header"`를 부여한다. `frontend/components/BackToTopButton.tsx`는 RootLayout에서 fixed header와 `PullToRefresh` 사이의 비변환 sibling으로 한 번 mount되고, `usePathname`이 `/posts/`로 시작할 때만 target을 관찰한다. 이 element를 `IntersectionObserver({ rootMargin: "-60px 0px 0px 0px", threshold: 0 })`로 관찰하고 `entry.isIntersecting === false`, `entry.boundingClientRect.bottom <= 60`, `window.scrollY > 0`을 모두 만족할 때만 control을 표시하며 다시 보이면 숨긴다. `IntersectionObserver`가 없으면 passive scroll listener와 `requestAnimationFrame`에서 `getBoundingClientRect().bottom <= 60`으로 같은 조건을 계산한다. button DOM은 transformable content 밖에 있으므로 fixed containing block을 공유하지 않는다.

control은 상세 route에서만 render되고 header 아래 `top: 68px`, viewport horizontal center에 `z-index: 40`으로 fixed된다. visible control은 Lucide `ArrowUp` SVG icon-only button이고 accessible name은 `맨 위로 이동`, 정확히 `44×44px`이며 native `button`과 visible `focus-visible`을 사용한다. activation은 brand home과 같은 motion preference를 따라 document top으로 이동한다. focus를 강제로 다른 element로 옮기지 않는다.

상세 metadata 위의 목록 복귀 Link는 `href="/"`과 기존 focus/hover 동작을 유지하되, Unicode left-arrow glyph 대신 literal `< 목록` text만 표시한다. 별도 icon 또는 새 client behavior를 추가하지 않는다.

항상 노출하는 대안은 글 header와 thumbnail을 읽는 초기 화면에 불필요한 floating chrome을 추가해 제외한다. 우측 하단 배치는 흔하지만 댓글/좋아요와 시각적으로 경쟁하고 사용자가 요청한 중앙 상단 위치를 충족하지 않아 제외한다.

### 5. Top control은 subtle floating glass surface만 사용한다

Apple의 Liquid Glass에서 capsule, background separation과 짧은 interaction feedback만 가져온다. blue tint, 두꺼운 굴절 border, dynamic reflection, morphing과 강한 glow는 사용하지 않는다. 구현·문서 명칭은 `subtle floating glass surface`다.

정확한 surface contract는 다음과 같다.

| Property | Light | Dark |
|---|---|---|
| Size | 44×44px | 동일 |
| Inline padding / icon-label gap | 0 / 해당 없음 | 동일 |
| Radius | 999px | 999px |
| Text | 14px, weight 500, `ink` | 동일 |
| Background | `canvas` 80% | `surface-soft` 82% |
| Backdrop | `blur(12px) saturate(105%)` | 동일 |
| Border | `hairline` 90% 1px | `hairline` 92% 1px |
| Outer shadow | `0 1px 2px rgb(25 31 40 / 8%)` | `0 1px 2px rgb(0 0 0 / 28%)` |
| Inner highlight | `inset 0 1px 0 rgb(255 255 255 / 55%)` | `inset 0 1px 0 rgb(255 255 255 / 10%)` |

`backdrop-filter`와 `-webkit-backdrop-filter`를 함께 선언한다. 지원 gate는 `@supports ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)))`, fallback은 정확히 `@supports not ((backdrop-filter: blur(12px)) or (-webkit-backdrop-filter: blur(12px)))`를 사용한다. fallback은 filter를 제거하고 light `canvas` 96%, dark `surface-soft` 96%로 바꾼다. 새 global color token이나 mint tint를 추가하지 않는다.

hover는 light background를 `canvas` 88%, dark background를 `surface-soft` 90%로 높인다. pressed는 `translateY(1px)`와 outer shadow 제거, `focus-visible`은 2px `primary` outline과 2px offset이다. interaction은 140ms이고 reduced motion에서는 transform과 transition을 제거한다. blur/saturation 값은 scroll 중 animate하지 않는다. glass control은 화면에 동시에 하나만 존재한다.

SVG icon은 background와 4.5:1 이상, focus indicator는 인접색과 3:1 이상을 실제 light/dark 본문 위에서 확인한다. decorative hairline은 control 식별의 유일한 단서로 사용하지 않는다. forced-colors에서 background/filter/shadow에 의존하지 않고 native button과 focus outline이 남는지 browser QA한다.

### 6. TOC는 내부 scroll을 없애고 fit할 때만 sticky다

`TOC`는 required prop `variant: "inline" | "sidebar"`를 받는다. 두 variant 모두 현재 h1/h2 extraction, active section 계산과 click lock을 유지한다. heading 이동은 `getScrollBehavior`를 사용해 기본 `smooth`, reduced motion `auto`를 적용한다. 공통 nav에서 `max-height`, `overflow-y-auto`, right padding과 `custom-scrollbar` class를 제거하고 `globals.css`의 TOC scrollbar rules도 삭제한다.

`inline`은 항상 normal document flow다. `sidebar`는 nav height를 `ResizeObserver`와 window resize에서 측정한다. `shouldStickToc(contentHeight, viewportHeight)`는 `contentHeight <= viewportHeight - 120`일 때만 true다. true면 `sticky top-[100px]`, false 또는 `ResizeObserver` 미지원이면 normal flow다. 초기 render는 non-sticky로 시작해 긴 TOC 하단이 viewport 밖에 고정되는 상태를 만들지 않는다.

모든 heading item은 DOM에 한 번에 존재하며 TOC 안에서 wheel/touch scrolling이 발생하지 않는다. 긴 desktop TOC는 document scroll과 함께 이동해 모든 item에 접근할 수 있다.

단순히 overflow만 제거하고 항상 sticky를 유지하는 대안은 viewport보다 긴 목차의 하단을 article 끝까지 접근하기 어렵게 만들 수 있어 제외한다. 모든 TOC의 sticky를 제거하는 대안은 짧은 목차의 현재 navigation 이점을 불필요하게 잃어 제외한다.

### 7. File and interface map

| File | Responsibility |
|---|---|
| `frontend/lib/scroll-ux.ts` | pull distance/phase, motion behavior, TOC fit의 순수 결정 |
| `frontend/lib/scroll-ux.test.ts` | boundary와 state decision Node tests |
| `frontend/components/PullToRefresh.tsx` | capability gate, touch lifecycle, transform, status indicator, reload |
| `frontend/components/HeaderHomeLink.tsx` | root navigation, filter reset, top scroll |
| `frontend/components/BackToTopButton.tsx` | article header observation, top control과 accessible interaction |
| `frontend/components/TOC.tsx` | inline/sidebar variant, full content, conditional sticky |
| `frontend/app/layout.tsx` | fixed header, global top overlay와 pull content boundary 조립 |
| `frontend/app/posts/[slug]/page.tsx` | article header id와 TOC variant 조립 |
| `frontend/app/globals.css` | pull/reduced-motion, glass/fallback, obsolete TOC scrollbar removal |
| `frontend/package.json` | `test:scroll-ux` script |
| `docs/design.md` | 승인된 global header, scroll navigation, TOC와 glass contract |

`PostList`, post Markdown, engagement client, theme toggle와 backend는 변경하지 않는다.

### 8. Verification strategy

순수 unit test는 다음 boundary를 고정한다.

- raw distance `-1, 0, 71, 72`의 clamp와 `pulling/armed` 전환
- resistance와 96px maximum
- reduced motion의 `auto`, 기본의 `smooth`
- TOC height가 `viewportHeight - 120`과 같을 때 sticky, 1px 클 때 non-sticky

Chromium browser QA는 375×812와 1280×720, light/dark에서 fixed header geometry, home filter reset/top, detail control visibility/keyboard/focus/glass fallback, TOC nested scroll 부재와 console error를 확인한다. custom pull state는 touch-capable emulation 또는 component state harness로 indicator/offset/reload 1회 호출을 확인하되 실제 iOS 결과를 대신하지 않는다.

실제 iOS Safari release gate는 다음을 모두 확인한다.

1. 목록·상세·소개 root top pull에서 header top/height가 pixel-fixed다.
2. unit test가 71px/72px numeric boundary를 고정하고, 실기기에서는 armed text 이전 release가 cancel되며 armed text 이후 release가 reload를 한 번 발생시킨다.
3. custom indicator와 native pull-to-refresh가 동시에 나타나지 않는다.
4. horizontal back/forward swipe, normal bidirectional scroll, link/button tap, code horizontal scroll와 pinch zoom이 회귀하지 않는다.
5. reduced motion과 VoiceOver status announcement가 contract와 일치한다.

## Risks / Trade-offs

- **Browser가 overscroll CSS를 지원하지만 native action 억제가 불완전할 수 있음** → capability gate와 실제 iOS release gate를 사용하고 중복 indicator가 보이면 release를 중단해 main의 기존 native refresh를 유지한다.
- **Non-passive touchmove가 normal interaction을 막을 수 있음** → root top, single downward vertical gesture와 non-interactive target에서 pulling이 시작된 이후에만 `preventDefault()`를 호출하고 cancel/multi-touch를 즉시 해제한다.
- **Fixed header가 content를 가릴 수 있음** → shell에 정확한 60px offset을 두고 existing heading `scroll-margin-top: 80px`를 유지한다.
- **Idle content transform이 상세 fixed control의 containing block을 바꿀 수 있음** → pull 중에만 transform/will-change를 설정하고 idle 복귀 시 property 자체를 제거한다.
- **Backdrop filter가 icon contrast 또는 low-power scroll 성능을 해칠 수 있음** → 44×44 한 control에 static 12px blur만 적용하고 불투명 fallback과 실제 contrast/scroll QA를 둔다.
- **TOC 측정 후 sticky 전환이 흔들릴 수 있음** → initial non-sticky, ResizeObserver update를 animation 없이 적용하고 height change가 있을 때만 state를 갱신한다.
- **Next route query reset과 smooth scroll 순서가 경합할 수 있음** → root에서는 `router.replace(..., { scroll: false })`로 framework scroll을 끄고 단일 helper만 top scroll을 소유한다.

## Migration Plan

data 또는 backend migration은 없다. 구현은 순수 helper tests → global shell/PTR → navigation controls → TOC → docs/browser QA 순서로 배포한다. production 문제가 있으면 이 change PR을 revert해 기존 sticky header, native pull-to-refresh, Link와 scrollable TOC로 원복한다. 별도 persistent state나 cleanup은 필요하지 않다.

실제 프로젝트 소유자의 iOS Safari에서 native/custom indicator 중복, header 이동 또는 gesture 회귀가 하나라도 발생하면 이 change의 PTR 구현은 release 조건을 충족하지 못한다. 해당 task를 완료 표시하지 않고 제품 배포·base spec 동기화·archive를 진행하지 않는다. 수정 후 같은 실기기 gate를 다시 통과해야 하며, 해결 전 main에는 기존 native refresh를 유지한다. capability check만으로 실제 native 억제를 runtime 판정했다고 간주하지 않는다.

## Open Questions

없음. capability 조건을 만족하지 않는 browser는 native fallback이고, 조건을 만족하는 구현도 필수 iOS Safari gate를 모두 통과하지 못하면 release하지 않는다.

## Research Basis

- [W3C CSS Overscroll Behavior](https://www.w3.org/TR/css-overscroll-1/)
- [MDN overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior)
- [MDN Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [MDN position](https://developer.mozilla.org/en-US/docs/Web/CSS/position)
- [Apple: Applying Liquid Glass to custom views](https://developer.apple.com/documentation/SwiftUI/Applying-Liquid-Glass-to-custom-views)
- [MDN backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/backdrop-filter)
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)
- [WCAG 2.2 Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
