## ADDED Requirements

### Requirement: Stable global header and progressive pull-to-refresh

시스템은 목록, 게시글 상세와 소개 페이지에서 60px header를 viewport에 고정하고, 지원되는 coarse touch browser에서 header를 이동시키지 않는 root document pull-to-refresh를 제공해야 한다(MUST). 지원 조건을 만족하지 않는 browser의 native refresh와 기본 touch behavior를 강제로 대체하면 안 된다(MUST NOT).

#### Scenario: Header remains a stable viewport anchor
- **WHEN** 사용자가 목록, 상세 또는 소개 페이지를 일반 scroll하거나 root top에서 콘텐츠를 아래로 당긴다
- **THEN** header의 viewport top은 `0px`, 높이는 `60px`로 유지된다
- **AND** pull transform은 header가 아닌 main·footer content surface에만 적용된다
- **AND** page content는 idle 상태에서 header 아래 60px 이후에 시작해 header에 가려지지 않는다

#### Scenario: Eligible pull communicates progress and reloads
- **WHEN** 지원 browser의 `window.scrollY === 0`에서 사용자가 non-interactive content를 한 손가락으로 아래 방향 우세하게 당긴다
- **THEN** raw distance `0..71px`에서는 `아래로 당겨 새로고침`과 `pulling` 상태를 표시한다
- **AND** raw distance `72px` 이상에서는 `놓으면 새로고침`과 `armed` 상태를 표시한다
- **AND** content visual offset은 raw distance에 0.55 resistance를 적용하고 `0..96px`로 제한된다
- **WHEN** 사용자가 `armed` 상태에서 손가락을 놓는다
- **THEN** 시스템은 `새로고침 중`과 busy 상태를 표시한 뒤 `window.location.reload()`를 정확히 한 번 호출한다

#### Scenario: Incomplete or cancelled pull returns safely
- **WHEN** 사용자가 raw distance `72px` 미만에서 손가락을 놓거나 `touchcancel`이 발생한다
- **THEN** content offset은 0으로 돌아가고 상태는 `idle`이 된다
- **AND** idle content의 computed transform은 `none`이며 `will-change`가 남지 않는다
- **AND** reload는 호출되지 않는다
- **WHEN** custom activation 전 gesture가 upward, horizontal 우세, multi-touch가 되거나 `window.scrollY > 0`이다
- **THEN** custom gesture를 시작하지 않고 현재 interaction을 native behavior에 위임한다
- **WHEN** activation 후 같은 touch가 방향을 바꾸거나 multi-touch가 된다
- **THEN** offset을 0으로 복귀시키고 reload 없이 custom gesture를 종료한다
- **AND** 다음 새 gesture부터 native behavior를 다시 허용하며 이미 차단한 현재 touch의 native 재개는 보장하지 않는다

#### Scenario: Interactive and inner-scroll gestures are excluded
- **WHEN** gesture가 link, button, form control, editable content, code block, `data-pull-refresh-ignore` 또는 내부 `overflow: auto|scroll` 영역에서 시작한다
- **THEN** custom pull indicator와 content transform은 활성화되지 않는다
- **AND** tap, form interaction, horizontal code scroll와 pinch zoom의 native behavior가 유지된다

#### Scenario: Unsupported browser uses native fallback
- **WHEN** browser가 `overscroll-behavior-y: contain`, coarse touch pointer 또는 `navigator.maxTouchPoints > 0` 조건 중 하나를 만족하지 않는다
- **THEN** 시스템은 pull data attribute, custom indicator, transform과 non-passive move listener를 활성화하지 않는다
- **AND** browser의 기본 refresh와 scroll behavior를 유지한다

#### Scenario: Actual iOS verification controls delivery
- **WHEN** 실제 프로젝트 소유자의 iOS Safari에서 native/custom indicator 중복, header 이동 또는 scroll·navigation·tap·zoom 회귀 중 하나라도 발견된다
- **THEN** custom pull-to-refresh를 완료 표시, product 배포, base spec 동기화 또는 archive하면 안 된다
- **AND** 수정 후 같은 실기기 gate를 통과하기 전까지 main은 기존 native refresh를 유지한다

#### Scenario: Pull status is accessible and motion-aware
- **WHEN** custom phase가 `pulling`, `armed`, `refreshing`으로 바뀐다
- **THEN** `role="status"`의 polite live region은 각각 `아래로 당겨 새로고침`, `놓으면 새로고침`, `새로고침 중`을 상태 변화당 한 번 전달한다
- **AND** refreshing 동안 `aria-busy="true"`를 제공하며 keyboard focus를 이동하지 않는다
- **WHEN** `prefers-reduced-motion: reduce`가 활성화되어 있다
- **THEN** spring, spinner rotation과 transition은 제거되지만 pull 위치와 text feedback은 유지된다

### Requirement: Predictable brand home navigation

시스템은 global `Yehyeok` brand control을 site root와 document top을 복원하는 home action으로 제공해야 한다(MUST).

#### Scenario: Home action resets a filtered feed and returns to top
- **WHEN** 사용자가 pathname `/`의 tag query가 적용된 목록을 scroll한 뒤 `Yehyeok`을 누른다
- **THEN** 시스템은 `tag` query만 제거해 `전체` 목록으로 바꾸고 다른 query key는 보존한다
- **AND** framework route change와 별개인 하나의 scroll owner가 document top `0`으로 이동시킨다

#### Scenario: Home action returns an unfiltered feed to top
- **WHEN** 사용자가 pathname `/`의 query 없는 목록에서 `window.scrollY > 0`인 상태로 `Yehyeok`을 누른다
- **THEN** route를 중복 추가하지 않고 document top `0`으로 이동한다
- **WHEN** 이미 `window.scrollY === 0`이다
- **THEN** 불필요한 scroll animation을 시작하지 않는다

#### Scenario: Home action navigates from another route
- **WHEN** 사용자가 게시글 상세 또는 소개 페이지에서 `Yehyeok`을 누른다
- **THEN** 시스템은 `/`로 client navigation하고 새 목록 화면을 document top에서 시작한다

#### Scenario: Home scrolling respects motion preference
- **WHEN** motion preference가 기본값이다
- **THEN** same-page top 이동은 `smooth` behavior를 사용한다
- **WHEN** `prefers-reduced-motion: reduce`가 활성화되어 있다
- **THEN** top 이동은 `auto` behavior를 사용한다

### Requirement: Contextual detail back-to-top control

시스템은 게시글 상세에서 article header가 fixed header 위로 사라진 뒤에만 viewport 상단 중앙의 back-to-top control을 제공해야 한다(MUST). 목록과 소개 페이지에는 이 control을 표시하면 안 된다(MUST NOT).

#### Scenario: Control visibility follows article header
- **WHEN** 게시글 제목·metadata header가 fixed header 아래에 보인다
- **THEN** back-to-top control은 숨겨진다
- **WHEN** article header가 60px fixed header 위로 완전히 사라지고 document가 top보다 아래에 있다
- **THEN** `↑ 위로` control은 viewport top `68px`, `z-index: 40`의 가로 중앙에 `88×44px`로 표시된다
- **WHEN** top으로 돌아가 article header가 다시 보인다
- **THEN** control은 다시 숨겨진다

#### Scenario: Control returns to document top
- **WHEN** 사용자가 visible `↑ 위로` control을 pointer 또는 keyboard로 활성화한다
- **THEN** document는 top `0`으로 이동한다
- **AND** 기본 motion preference에서는 `smooth`, reduced motion에서는 `auto` behavior를 사용한다
- **AND** control은 focus를 강제로 다른 element로 옮기지 않는다

#### Scenario: Control is an accessible target
- **WHEN** back-to-top control이 표시된다
- **THEN** native button, visible label `↑ 위로`, accessible name `맨 위로 이동`, 최소 44px hit area와 visible `focus-visible`을 제공한다
- **AND** label과 icon은 실제 light/dark 배경에서 4.5:1 이상, focus indicator는 인접색과 3:1 이상의 대비를 갖는다
- **AND** forced-colors에서도 text와 focus indicator가 식별 가능하다

#### Scenario: Control uses restrained glass with fallback
- **WHEN** browser가 `backdrop-filter` 또는 `-webkit-backdrop-filter`를 지원한다
- **THEN** control은 light `canvas` 80% 또는 dark `surface-soft` 82%, `blur(12px) saturate(105%)`, 1px hairline, 최대 `0 1px 2px` outer shadow와 약한 inner highlight를 사용한다
- **AND** blue tint, dynamic reflection, morphing, 강한 glow 또는 scroll 중 blur animation을 사용하지 않는다
- **WHEN** backdrop filter를 지원하지 않는다
- **THEN** filter 없이 light `canvas` 96% 또는 dark `surface-soft` 96%의 동일한 usable control을 표시한다

#### Scenario: Control interaction remains restrained
- **WHEN** 사용자가 control을 hover한다
- **THEN** light background는 `canvas` 88%, dark background는 `surface-soft` 90%가 되고 layout geometry는 바뀌지 않는다
- **WHEN** 사용자가 control을 누른다
- **THEN** outer shadow를 제거하고 reduced motion이 아닐 때만 `translateY(1px)`를 최대 140ms 적용한다
- **WHEN** keyboard focus가 control에 있다
- **THEN** 2px primary outline과 2px offset을 표시한다

### Requirement: Fully visible article table of contents

시스템은 mobile inline과 desktop sidebar 목차의 모든 h1·h2 item을 한 번에 렌더링하고 TOC 내부 세로 scroll surface를 만들면 안 된다(MUST NOT). 기존 heading 이동과 active section 강조는 유지해야 한다(MUST).

#### Scenario: Inline table of contents expands in document flow
- **WHEN** mobile 상세 페이지의 목차가 viewport보다 길다
- **THEN** 모든 목차 item은 normal document flow에 렌더링된다
- **AND** TOC nav에 `max-height`, `overflow-y: auto|scroll` 또는 custom scrollbar를 적용하지 않는다
- **AND** 사용자는 document scroll만으로 마지막 목차 item에 접근할 수 있다

#### Scenario: Short desktop table of contents remains sticky
- **WHEN** desktop sidebar TOC의 실제 높이가 `viewportHeight - 120px` 이하이다
- **THEN** TOC는 `top: 100px`에서 sticky로 동작한다
- **AND** 현재 section 강조와 heading click의 smooth 이동을 유지한다

#### Scenario: Long desktop table of contents joins document flow
- **WHEN** desktop sidebar TOC의 실제 높이가 `viewportHeight - 120px`보다 크다
- **THEN** TOC는 sticky를 해제하고 normal document flow로 이동한다
- **AND** 내부 scrollbar 없이 document scroll로 모든 item에 접근할 수 있다
- **WHEN** ResizeObserver를 사용할 수 없거나 아직 측정하지 못했다
- **THEN** 시스템은 접근 가능한 non-sticky 상태를 기본값으로 사용한다

#### Scenario: TOC preserves existing navigation semantics
- **WHEN** 사용자가 mobile 또는 desktop TOC item을 활성화한다
- **THEN** 시스템은 기본 motion preference에서 해당 h1·h2 element로 smooth scroll하고 reduced motion에서는 auto scroll하며 현재 item을 primary color로 강조한다
- **AND** blockquote 안 heading과 id 없는 heading은 기존과 같이 목차에서 제외된다
