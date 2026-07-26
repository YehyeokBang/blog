# 피드 UI 접근성 개선 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모바일 썸네일의 현행 상단 배치를 유지하면서 피드의 태그 스크롤 인지성, 카드 클릭 영역, 키보드 포커스 접근성을 개선하고 문서 계약을 실제 동작과 일치시킨다.

**Architecture:** `PostList`가 태그 컨테이너의 실제 overflow 상태를 관찰해 우측 스크롤 단서를 조건부로 표시한다. 각 포스트는 태그 링크를 제외한 카드 영역 전체가 하나의 상세 링크가 되며, 모바일 썸네일은 현재처럼 텍스트 위에 유지한다. OpenSpec과 디자인 문서는 같은 반응형·상호작용 계약을 명시한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Node test runner, OpenSpec

## Global Constraints

- 모바일(`sm` 미만) 썸네일은 숨기지 않고 글 정보 위의 가로 이미지로 표시한다.
- 데스크톱(`sm` 이상) 썸네일은 글 정보 우측에 표시한다.
- 카드 내부 태그 링크는 필터로 이동하고 포스트 상세 이동을 발생시키지 않는다.
- 마우스 클릭의 미관은 유지하되 `focus-visible` 키보드 포커스는 명확히 보여야 한다.
- 태그 스크롤 단서는 실제로 오른쪽에 숨은 콘텐츠가 있을 때만 표시하고 스크롤 끝에서는 사라져야 한다.
- 새 기능이나 범용 추상화를 추가하지 않고 피드 UI에 필요한 최소 변경만 한다.

---

### Task 1: 피드 UI 상호작용 구현

**Files:**
- Modify: `frontend/components/PostList.tsx`
- Create or modify: `frontend/lib/feed-ui.ts`
- Test: `frontend/lib/feed-ui.test.ts`
- Modify: `frontend/package.json`

**Interfaces:**
- Produces: `hasHorizontalOverflow({ scrollWidth, clientWidth, scrollLeft }): boolean`
- Consumes: 브라우저 scroll container의 `scrollWidth`, `clientWidth`, `scrollLeft`

- [x] **Step 1: overflow 판정 테스트를 먼저 작성한다**

`scrollWidth > clientWidth + scrollLeft + 1`일 때만 `true`가 되며, overflow가 없거나 오른쪽 끝에 도달하면 `false`가 되는 사례를 작성한다.

- [x] **Step 2: 테스트가 구현 부재로 실패하는지 확인한다**

Run: `cd frontend && node --test --experimental-strip-types lib/feed-ui.test.ts`

- [x] **Step 3: 최소 overflow 판정 함수와 조건부 우측 그라데이션을 구현한다**

태그 컨테이너의 mount, resize, scroll에서 상태를 갱신한다. 그라데이션은 클릭을 가로막지 않도록 `pointer-events-none`이어야 한다.

- [x] **Step 4: 카드 전체 링크와 독립 태그 링크를 구현한다**

중첩 anchor를 만들지 않는다. 제목과 썸네일의 중복 링크를 제거하고 카드의 태그를 제외한 나머지 영역이 하나의 상세 링크가 되게 한다. 모바일 `flex-col-reverse` 상단 썸네일과 데스크톱 우측 배치는 유지한다.

- [x] **Step 5: 모든 피드 링크에 `focus-visible` 포커스 스타일을 적용한다**

`focus:outline-none` 단독 사용을 제거하고 디자인 토큰의 primary 색으로 식별 가능한 ring/outline을 제공한다.

- [x] **Step 6: 테스트·lint·build를 실행한다**

Run:

```bash
cd frontend
npm run test:feed-ui
npm run lint
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
```

### Task 2: 피드 반응형 계약 문서 정합성 수정

**Files:**
- Modify: `openspec/specs/blog-rendering/spec.md`
- Modify: `docs/design.md`

**Interfaces:**
- Produces: 실제 `PostList` 구현과 일치하는 피드 반응형·클릭·포커스 계약

- [x] **Step 1: 모바일 썸네일 시나리오를 현행 의도로 수정한다**

OpenSpec의 “모바일에서 숨김”을 “모바일에서 글 정보 위의 가로 이미지, `sm` 이상에서 우측 고정 비율 이미지”로 바꾼다.

- [x] **Step 2: 태그 스크롤 단서와 포커스 계약을 명시한다**

디자인 문서에 overflow가 남을 때의 시각적 단서와 `focus-visible` 원칙을 추가한다.

- [x] **Step 3: 문서와 OpenSpec 검증을 실행한다**

Run:

```bash
./scripts/validate-openspec.sh
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```
