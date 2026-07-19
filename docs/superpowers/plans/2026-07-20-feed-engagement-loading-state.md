# 피드 반응 지표 로딩 상태 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 피드의 미확인 반응 수를 `0`으로 표시하지 않고, 지표 영역 skeleton 뒤에 서버가 확인한 좋아요·댓글 수를 함께 표시한다.

**Architecture:** `engagement.ts`의 순수 상태 해석 함수가 `loading | ready | error`를 구분하고 `PostList`는 그 상태만 렌더링한다. 정적 article 콘텐츠는 즉시 유지하며, 로딩 중에는 지표 한 줄의 공간만 예약한 CSS shimmer를 사용한다.

**Tech Stack:** Next.js 16 static export, React 19, TypeScript, Tailwind CSS 4, Node test runner, Spring Boot 4.1 local API.

## Global Constraints

- 상세 `PostLikeButton`, backend API와 `content/posts/` 파일은 변경하지 않는다.
- 미확인 count를 `0` 또는 성공 값으로 표시하지 않는다.
- 제목, 설명, 날짜, tag, thumbnail과 navigation은 projection을 기다리지 않고 즉시 표시한다.
- 모든 projection page가 완료된 뒤 좋아요와 댓글 count를 함께 표시한다.
- skeleton은 기존 지표 줄의 공간을 예약하고 light/dark의 기존 surface token만 사용한다.
- skeleton 장식은 보조기기에서 숨기고 컨테이너는 `aria-busy`를 제공한다.
- `prefers-reduced-motion`에서는 shimmer animation을 제거한다.
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

- [ ] **Step 1: Write the failing state tests**

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

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `cd frontend && npm run test:engagement`

Expected: FAIL because `resolveFeedEngagementState` is not exported.

- [ ] **Step 3: Implement the minimal state resolver**

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

- [ ] **Step 4: Render the three states in `PostList`**

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

- [ ] **Step 5: Add restrained shimmer and reduced-motion fallback**

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

- [ ] **Step 6: Verify GREEN and frontend quality gates**

Run:

```bash
cd frontend
npm run test:engagement
npm run lint
NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
```

Expected: all commands pass.

- [ ] **Step 7: Commit the implementation**

```bash
git add frontend/lib/engagement.ts frontend/lib/engagement.test.ts frontend/components/PostList.tsx frontend/app/globals.css
git commit -m "refactor: 피드 반응 지표 로딩 상태 개선"
```

### Task 2: OpenSpec evidence and local visual verification

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

Mark task `3.6` complete only after the automated checks and browser checks above pass. Do not change unrelated unchecked tasks.

- [ ] **Step 5: Run repository documentation and OpenSpec gates**

```bash
./scripts/validate-openspec.sh
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

Expected: all checks pass.

- [ ] **Step 6: Stop before push and PR**

Leave both local servers running for the user to inspect. Do not push or create a PR until the user confirms the local result.
