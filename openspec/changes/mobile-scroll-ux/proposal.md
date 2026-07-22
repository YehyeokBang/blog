## Why

모바일 브라우저의 기본 당겨서 새로고침은 문서 전체와 현재 sticky header를 함께 이동시켜 화면의 기준점이 흔들리고, 긴 목록·상세 글에서는 상단으로 돌아가는 명확한 수단도 부족하다. 모든 페이지에서 header를 안정적으로 유지하면서 새로고침 진행 상태와 상단 이동 가능성을 분명하게 전달하고, 긴 목차의 중첩 스크롤을 제거할 필요가 있다.

## What Changes

- 지원되는 모바일 브라우저에서 목록·상세·소개 페이지 공통으로 고정 header 아래 콘텐츠만 당겨지는 점진적 custom pull-to-refresh를 제공한다.
- 당김 거리별로 `아래로 당겨 새로고침`, `놓으면 새로고침`, `새로고침 중` 상태를 표시하고, 승인 임계점에서 실제 문서 reload를 실행한다.
- 지원되지 않는 브라우저에서는 touch 입력을 강제로 가로채지 않고 브라우저 기본 새로고침을 유지한다.
- 목록의 `Yehyeok` home control이 query 기반 tag filter를 초기화하고 문서 최상단으로 이동하도록 한다.
- 상세 페이지의 글 header가 화면에서 사라진 뒤 header 아래 중앙에 접근 가능한 `↑ 위로` control을 표시한다.
- `↑ 위로` control은 기존 색상 토큰 안에서 절제된 floating glass surface를 사용하고, backdrop filter 미지원 환경에는 불투명 surface fallback을 제공한다.
- 상세 목차의 내부 높이 제한과 세로 scrollbar를 제거하고, desktop에서는 전체 목차가 viewport에 들어올 때만 sticky로 유지한다.

## Capabilities

### New Capabilities

- `scroll-navigation`: 전역 header 안정성, 점진적 pull-to-refresh, home/top navigation과 전체 목차 접근성을 정의한다.

### Modified Capabilities

- 없음.

## Impact

- `frontend/app/layout.tsx`의 공통 shell과 header positioning이 변경된다.
- `frontend/components/`에 pull-to-refresh, home control, 상세 top control을 담당하는 client component가 추가된다.
- `frontend/components/TOC.tsx`는 inline/sidebar variant와 viewport 적합성에 따른 sticky 정책을 갖는다.
- `frontend/lib/`에 제스처 상태와 scroll navigation 결정을 검증 가능한 순수 함수로 분리하고 Node test를 추가한다.
- `frontend/app/globals.css`, `frontend/package.json`, `docs/design.md`가 새 interaction·surface·검증 계약을 반영한다.
- backend API, database, analytics, deployment route와 `content/posts/*.md`는 변경하지 않는다.

## Non-Goals

- 구형 iOS를 포함한 모든 touch browser에서 custom pull-to-refresh를 강제로 활성화하는 일
- 부분 데이터 재조회, background synchronization 또는 service worker 기반 refresh
- 목록 pagination·infinite scroll 방식이나 tag filtering 데이터 계약 변경
- Apple Liquid Glass의 동적 굴절, blue tint, morphing 또는 강한 specular effect 복제
- post heading 추출 범위와 현재 section 계산 알고리즘 변경
