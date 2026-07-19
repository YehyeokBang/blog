# 피드 반응 지표 로딩 상태 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 피드의 반응 지표, typography, theme control과 thumbnail이 준비되는 동안 desktop/mobile layout geometry를 유지한다.

**Architecture:** `engagement.ts`의 순수 상태 해석 함수가 `loading | ready | error`를 구분하고 `PostList`는 모든 상태에 같은 높이의 metric box를 사용한다. Pretendard 1.3.9는 frontend dependency에서 self-host하고, theme toggle과 thumbnail은 준비 전후 동일한 box 안에서만 시각 상태를 바꾼다.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Tailwind CSS 4, Pretendard 1.3.9, Node test runner, Spring Boot 4.1 local API.

## Global Constraints

- 상세 `PostLikeButton`, backend API와 `content/posts/` 파일은 변경하지 않는다.
- 미확인 count를 `0` 또는 성공 값으로 표시하지 않는다.
- 제목, 설명, 날짜, tag, thumbnail과 navigation은 projection을 기다리지 않고 즉시 표시한다.
- 모든 projection page가 완료된 뒤 좋아요와 댓글 count를 함께 표시한다.
- skeleton은 실제 반응 지표 전체와 같은 높이·너비를 예약한 단일 bar이고 light/dark의 기존 surface token만 사용한다.
- skeleton 장식은 보조기기에서 숨기고 컨테이너는 `aria-busy`를 제공한다.
- `prefers-reduced-motion`에서는 shimmer animation을 제거한다.
- Pretendard는 외부 CDN이 아니라 exact npm dependency `pretendard@1.3.9`에서 self-host한다.
- Theme toggle의 hydration 전후 box는 모두 `36×36px`다.
- Thumbnail은 기존 aspect ratio box 안에서 skeleton과 image opacity만 전환한다.
- commit과 PR은 English Conventional Commit prefix와 한국어 설명을 사용한다.

---

### Task 1: 피드 반응 상태와 skeleton UI

**Files:**
- Modify: `frontend/lib/engagement.ts`
- Modify: `frontend/lib/engagement.test.ts`
- Modify: `frontend/components/PostList.tsx`
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Produces: `resolveFeedEngagementState(engagements, slug, hasError): FeedEngagementState`
- `FeedEngagementState` is `{ status: "loading" } | { status: "error" } | { status: "ready"; likeCount: number; commentCount: number }`.

- [x] **Step 1: Write the failing state tests**

```ts
test("피드 반응 상태는 미확인 count와 실제 0을 구분한다", () => {
  assert.deepEqual(resolveFeedEngagementState(null, "test-post", false), { status: "loading" });
  assert.deepEqual(
    resolveFeedEngagementState(
      new Map([["test-post", { likeCount: 0, commentCount: 0 }]]),
      "test-post",
      false,
    ),
    { status: "ready", likeCount: 0, commentCount: 0 },
  );
});

test("피드 반응 상태는 실패와 누락 응답을 오류로 구분한다", () => {
  assert.deepEqual(resolveFeedEngagementState(null, "test-post", true), { status: "error" });
  assert.deepEqual(resolveFeedEngagementState(new Map(), "test-post", false), { status: "error" });
});
```

- [x] **Step 2: Run the targeted test and verify RED**

Run: `cd frontend && npm run test:engagement`

Expected: FAIL because `resolveFeedEngagementState` is not exported.

- [x] **Step 3: Implement the minimal state resolver**

```ts
export type FeedEngagementState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; likeCount: number; commentCount: number };

export function resolveFeedEngagementState(
  engagements: Map<string, Omit<FeedEngagement, "slug">> | null,
  slug: string,
  hasError: boolean,
): FeedEngagementState {
  if (hasError) return { status: "error" };
  if (engagements === null) return { status: "loading" };
  const engagement = engagements.get(slug);
  if (!engagement) return { status: "error" };
  return { status: "ready", ...engagement };
}
```

- [x] **Step 4: Render the three states in `PostList`**

Initialize `engagements` with `null`, resolve each article state once, and render:

```tsx
{engagementState.status === "loading" ? (
  <p className="mb-lg flex h-[20px] items-center gap-xs text-[13px] md:text-caption text-muted" aria-busy="true">
    <span className="sr-only">반응 정보 불러오는 중</span>
    <span aria-hidden="true" className="flex items-center gap-xs">
      <span>♡</span>
      <span className="engagement-skeleton h-[0.75em] w-[1.5em] rounded-full" />
      <span>댓글</span>
      <span className="engagement-skeleton h-[0.75em] w-[1.5em] rounded-full" />
    </span>
  </p>
) : engagementState.status === "error" ? (
  <p className="mb-lg text-[13px] text-muted">반응 정보를 불러오지 못했습니다.</p>
) : (
  <p className="mb-lg text-[13px] md:text-caption text-muted" aria-label={`좋아요 ${engagementState.likeCount}, 댓글 ${engagementState.commentCount}`}>
    ♡ {engagementState.likeCount} 댓글 {engagementState.commentCount}
  </p>
)}
```

- [x] **Step 5: Add restrained shimmer and reduced-motion fallback**

```css
.engagement-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-surface-muted) 25%,
    var(--color-hairline) 50%,
    var(--color-surface-muted) 75%
  );
  background-size: 200% 100%;
  animation: engagement-skeleton-shimmer 1.4s ease-in-out infinite;
}

@keyframes engagement-skeleton-shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .engagement-skeleton { animation: none; }
}
```

- [x] **Step 6: Verify GREEN and frontend quality gates**

Run:

```bash
cd frontend
npm run test:engagement
npm run lint
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
```

Expected: all commands pass.

- [x] **Step 7: Commit the implementation**

```bash
git add frontend/lib/engagement.ts frontend/lib/engagement.test.ts frontend/components/PostList.tsx frontend/app/globals.css
git commit -m "refactor: 피드 반응 지표 로딩 상태 개선"
```

### Task 2: 최초 렌더 geometry 안정화

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/components/PostList.tsx`
- Modify: `frontend/components/ThemeToggle.tsx`
- Modify: `frontend/components/PostThumbnail.tsx`

**Interfaces:**
- Consumes: exact dependency `pretendard@1.3.9` and its `dist/web/variable/pretendardvariable.css` entry.
- Produces: `36×36px` theme control geometry, `6.5rem × 20px` feed metric geometry, and thumbnail image readiness contained within the existing aspect-ratio box.

- [ ] **Step 1: Record the failing visual reproduction**

Use the supplied desktop/mobile recordings as RED evidence:

- fallback-to-Pretendard font swap changes article text metrics;
- ThemeToggle changes from `32×32px` placeholder to `36×36px` button;
- loading metric line and ready metric line have different line-height geometry;
- thumbnail paint changes abruptly inside its reserved box.

- [ ] **Step 2: Install the exact self-host font dependency**

Run: `cd frontend && npm install --save-exact pretendard@1.3.9`

Replace the external CDN import with:

```css
@import "pretendard/dist/web/variable/pretendardvariable.css";
```

- [ ] **Step 3: Replace metric fragments with one fixed skeleton bar**

Use `h-5 w-[6.5rem] leading-5` for loading and ready states. Loading renders one decorative child:

```tsx
<p className="mb-lg flex h-5 w-[6.5rem] items-center text-[13px] leading-5 text-muted md:text-caption" aria-busy="true">
  <span className="sr-only">반응 정보 불러오는 중</span>
  <span aria-hidden="true" className="engagement-skeleton block h-5 w-full rounded-md" />
</p>
```

- [ ] **Step 4: Keep ThemeToggle geometry identical across hydration**

Render both placeholder and button with `size-9 shrink-0`; remove padding from the button and center the icon with flex.

```tsx
if (!mounted) return <div className="size-9 shrink-0" aria-hidden="true" />;
```

- [ ] **Step 5: Keep thumbnail paint inside its reserved box**

Make `PostThumbnail` a client component, track `loaded`, render the existing skeleton background as an absolute layer, and fade the `Image` opacity after `onLoad`. Use `motion-reduce:transition-none` so reduced-motion removes the fade.

- [ ] **Step 6: Verify the expanded frontend quality gates**

```bash
cd frontend
npm run test:engagement
npm run lint
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
```

Expected: tests and build pass; lint has no new errors or warnings beyond the pre-existing `DetailItem` warning.

- [ ] **Step 7: Commit the geometry fixes**

```bash
git add frontend/package.json frontend/package-lock.json frontend/app/globals.css frontend/components/PostList.tsx frontend/components/ThemeToggle.tsx frontend/components/PostThumbnail.tsx
git commit -m "fix: 피드 최초 렌더 레이아웃 이동 제거"
```

### Task 3: OpenSpec evidence and local visual verification

**Files:**
- Modify: `openspec/changes/post-engagement-production/tasks.md`
- Modify: `docs/superpowers/plans/2026-07-20-feed-engagement-loading-state.md`

**Interfaces:** Uses the local backend at `http://localhost:8080` through the Next rewrite at `http://localhost:3000/api`.

- [ ] **Step 1: Start the local Spring Boot API**

Run from `backend/`:

```bash
./gradlew bootRun --args='--spring.datasource.url=jdbc:sqlite:build/local-dev/blog.db --spring.jpa.hibernate.ddl-auto=update --app.engagement.allowed-origins=http://localhost:3000 --app.engagement.cookie-secure=false'
```

Expected: Tomcat starts on port 8080 and the post manifest synchronizer completes.

- [ ] **Step 2: Start the Next development server**

Run from `frontend/`: `npm run dev`

Expected: Next serves `http://localhost:3000` and proxies `/api` to the backend.

- [ ] **Step 3: Verify the loading transition in a throttled browser**

At 375px and 1280px, delay `/api/post-engagements` and verify:

- static article text, thumbnail, tag and navigation remain immediately usable;
- only the engagement line shows skeleton blocks;
- no `♡ 0 댓글 0` appears before the response;
- both counts appear together after the response;
- the tag row does not move vertically;
- light/dark colors use existing tokens;
- reduced motion removes shimmer;
- API failure changes only the metric line to the error message.

- [ ] **Step 4: Record only verified OpenSpec evidence**

Mark tasks `3.6` and `3.7` complete only after the automated checks and browser checks above pass. Do not change unrelated unchecked tasks.

- [ ] **Step 5: Run repository documentation and OpenSpec gates**

```bash
./scripts/validate-openspec.sh
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

Expected: all checks pass.

- [ ] **Step 6: Commit, push and create the PR without stopping local servers**

Verify `gh auth status` uses `YehyeokBang`, commit evidenced docs, push `refactor/feed-engagement-loading-state`, and create a Korean PR using every section of `.github/pull_request_template.md`. Leave both local servers running for the user to inspect after the PR is created.
