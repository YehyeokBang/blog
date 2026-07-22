# Scroll Feedback Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the detail-page top control visually restrained and make eligible pull-to-refresh gestures visibly communicate their distance and release state.

**Architecture:** Keep the existing capability-gated gesture state machine and its real document reload intact. Add one pure progress helper for a testable threshold ratio, pass that ratio into the existing indicator, and render the visual ring entirely with SVG/CSS. Replace the text arrow in the existing top button with the already installed Lucide `ArrowUp` icon; do not change visibility, navigation, or focus behavior.

**Tech Stack:** Next.js 16, React 19 client components, Tailwind CSS 4/global CSS, `lucide-react`, Node test runner.

## Global Constraints

- No new dependencies, backend/API/DB/content-post changes, or changes to touch capability gating and reload semantics.
- The top control remains a native button, is shown only on `/posts/`, retains accessible name `맨 위로 이동`, 44px minimum hit area, focus-visible outline, forced-colors support, and reduced-motion behavior.
- The progress ring is visible only for existing non-idle custom pull states; unsupported browsers retain native behavior with no custom listener or indicator.
- `pulling`, `armed`, and `refreshing` retain their Korean status text and polite live-region semantics.
- User-approved visual direction: icon-only SVG top control; progress ring that fills from 0% to 100% at 72px and rotates only while refreshing.

---

### Task 1: Testable pull progress and UI feedback

**Files:**
- Modify: `frontend/lib/scroll-ux.test.ts`
- Modify: `frontend/lib/scroll-ux.ts`
- Modify: `frontend/components/PullToRefresh.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `openspec/changes/mobile-scroll-ux/design.md`
- Modify: `openspec/changes/mobile-scroll-ux/specs/scroll-navigation/spec.md`
- Modify: `openspec/changes/mobile-scroll-ux/tasks.md`

**Interfaces:**
- Produces: `getPullProgress(rawDistance: number): number`, clamped to `[0, 1]` using `PULL_REFRESH_THRESHOLD_PX`.
- Consumes: existing `PullRefreshPhase`, raw touch distance, requestAnimationFrame coalescing, and reload effect.

- [ ] **Step 1: Write the failing unit test**

Add this import and test before production code:

```ts
import { getPullProgress } from "./scroll-ux.ts";

test("당김 진행률은 72px 임계값까지 0에서 1로 제한한다", () => {
  assert.equal(getPullProgress(-1), 0);
  assert.equal(getPullProgress(0), 0);
  assert.equal(getPullProgress(36), 0.5);
  assert.equal(getPullProgress(72), 1);
  assert.equal(getPullProgress(120), 1);
});
```

- [ ] **Step 2: Verify RED**

Run `cd frontend && npm run test:scroll-ux`. Expected: import failure because `getPullProgress` is not exported.

- [ ] **Step 3: Implement only the pure helper**

```ts
export function getPullProgress(rawDistance: number): number {
  return Math.min(Math.max(rawDistance, 0) / PULL_REFRESH_THRESHOLD_PX, 1);
}
```

- [ ] **Step 4: Verify GREEN**

Run `cd frontend && npm run test:scroll-ux`. Expected: 7 passing tests.

- [ ] **Step 5: Render progress ring without changing gesture semantics**

Keep the current `rawDistance` rAF update and add a render state for it. Pass `getPullProgress(rawDistance)` to `PullRefreshIndicator`. Render a 28×28 SVG ring with a fixed `viewBox="0 0 32 32"`, `pathLength="1"`, a muted track, and a primary stroke whose `strokeDasharray` equals the progress ratio. The ring must be full in `armed`; only `refreshing` adds the existing rotation class. Keep the status text adjacent to it and add no new focusable element.

- [ ] **Step 6: Style and document the amended behavior**

Use existing color tokens for the ring; add a short non-spring `stroke-dasharray` transition only when reduced motion is off. In reduced-motion mode remove ring rotation and transition while retaining its static fill and text. Amend the active change design/spec/tasks with the exact fill/reload visual contract and run `./scripts/validate-openspec.sh`.

- [ ] **Step 7: Verify and commit**

Run:

```bash
cd frontend && npm run test:engagement && npm run test:scroll-ux && npm run lint
cd .. && ./scripts/validate-openspec.sh
```

Commit with `feat: 당김 새로고침 진행 표시 보강`.

### Task 2: Icon-only top control polish

**Files:**
- Modify: `frontend/components/BackToTopButton.tsx`
- Modify: `frontend/app/globals.css`
- Modify: `docs/design.md`
- Modify: `openspec/changes/mobile-scroll-ux/proposal.md`
- Modify: `openspec/changes/mobile-scroll-ux/design.md`
- Modify: `openspec/changes/mobile-scroll-ux/specs/scroll-navigation/spec.md`
- Modify: `openspec/changes/mobile-scroll-ux/tasks.md`

**Interfaces:**
- Consumes: existing `ArrowUp` component from installed `lucide-react` and existing click/visibility behavior.
- Produces: a 44×44 icon-only button with `aria-label="맨 위로 이동"`; no visible text arrow.

- [ ] **Step 1: Write a failing source-independent behavior test**

No DOM test runtime exists and the existing visibility/navigation helper is already covered. Add no brittle source-text assertion. Instead, preserve the Task 4 visibility test and use the browser QA below as the behavior proof; this visual-only component change has no new pure decision.

- [ ] **Step 2: Replace only the glyph**

Import `ArrowUp` from `lucide-react` and render `<ArrowUp aria-hidden="true" size={18} strokeWidth={2} />` inside the existing native button. Keep the accessible name and click handler unchanged.

- [ ] **Step 3: Make the surface read as a small control, not a text pill**

Set exact 44×44 dimensions, centered with `left: 50%; transform: translateX(-50%)`, `padding: 0`, and a 999px radius. Retain the existing token-based translucency, border, supports fallback, focus ring, forced-colors, and motion constraints. Do not introduce blue tint, dynamic reflection, glow, or a new color token.

- [ ] **Step 4: Update active OpenSpec and design documentation**

Change the active proposal/design/spec/docs from the visible `↑ 위로` label and 88×44 geometry to icon-only SVG, 44×44 geometry, and the unchanged accessible name. Add a new uncompleted task item for the visual regression check; do not complete it until browser evidence exists.

- [ ] **Step 5: Verify, review, and commit**

Run the same automated verification from Task 1, then use gstack `/browse` at 375×812 and 1280×720 in light/dark to record screenshot, keyboard focus/activation, console, and network results. Commit with `fix: 상단 이동 버튼 시각 완성도 개선`.

### Task 3: PR readiness

**Files:**
- Modify: `openspec/changes/mobile-scroll-ux/tasks.md` only for tasks with actual evidence.

- [ ] **Step 1: Run full required verification**

Run:

```bash
cd frontend && npm run test:engagement && npm run test:scroll-ux && npm run lint
cd frontend && NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
cd .. && ./scripts/validate-openspec.sh
node --test scripts/check-documentation.test.mjs
node scripts/check-documentation.mjs
```

- [ ] **Step 2: Review the complete branch diff**

Use a read-only reviewer to check the branch against `main`, including the active OpenSpec amendment and the new visual behavior.

- [ ] **Step 3: Create the PR**

Verify `gh auth status` has active account `YehyeokBang`, push only after the user-authorized verification succeeds, and create a Korean PR title/body following `.github/pull_request_template.md`. Record the existing unrelated about-page lint warning separately from zero lint errors.
