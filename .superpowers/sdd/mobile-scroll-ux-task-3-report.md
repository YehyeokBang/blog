# Mobile Scroll UX Task 3 Report

## Scope

- Implemented only Task 3: fixed 60px header, capability-gated pull-to-refresh, its status UI, and the inert `BackToTopButton` integration boundary.
- Did not implement Task 4 visibility/navigation behavior, Task 5 TOC behavior, backend changes, post changes, or OpenSpec task/document updates.

## TDD evidence

### RED

1. Added the focused `isPullActivationMove` cases to `frontend/lib/scroll-ux.test.ts` before adding the helper implementation.
2. Ran `npm run test:scroll-ux` from `frontend/`.
3. Observed the expected failure: `SyntaxError: The requested module './scroll-ux.ts' does not provide an export named 'isPullActivationMove'`.

### GREEN

1. Added the minimal `isPullActivationMove(deltaX, deltaY)` helper and consumed it from `PullToRefresh`.
2. Re-ran `npm run test:scroll-ux` from `frontend/`.
3. Result: 5 passing tests, 0 failures. The new test verifies downward vertical activation and rejects equal/horizontal/upward moves.

## Implementation and contract check

- `PullToRefresh` enables only after mount when overscroll support, coarse pointer, and touch points are all present. It sets/removes `html[data-pull-refresh="enabled"]` and only that selector sets `overscroll-behavior-y: contain`.
- Native listeners live on the transformable surface. `touchstart`, `touchend`, and `touchcancel` are passive; only `touchmove` is non-passive.
- Before activation, excluded/non-top/multitouch/upward/horizontal gestures return to native behavior. After activation, direction reversal, lost primary touch, multitouch, and cancel reset without reload.
- Move UI state is coalesced by one animation frame. Pulling/armed/refreshing uses only the surface inline `translate3d`; idle removes the inline `transform` and `will-change` properties.
- Armed release commits `refreshing` first, then an effect-scheduled animation frame guards and invokes exactly one `window.location.reload()`. Effect cleanup cancels the pending frame.
- The indicator has the required Korean phase text, a polite `role="status"` live region, `aria-busy` only when refreshing, and no focus movement. Reduced motion disables pull transition and spinner rotation while retaining text/position feedback.
- Root layout now uses a fixed `inset-x-0 top-0 z-50 h-[60px]` header. The inert `BackToTopButton` is a sibling outside `PullToRefresh`; only main/footer are inside the `flex min-h-[calc(100vh-60px)] flex-col` surface, which reserves the 60px top offset.
- CSS contains no transform/filter/will-change on a header ancestor. The header itself retains its existing backdrop blur.

## Verification

Executed from `frontend/` after the final code change:

```text
npm run lint
# exit 0; existing unrelated warning only:
# frontend/app/about/page.tsx: DetailItem is defined but never used

npm run test:scroll-ux
# 5 tests passed, 0 failed

NEXT_PUBLIC_SITE_URL=http://localhost:3000 npm run build
# exit 0
```

Also ran `git diff --check` successfully.

## Browser verification limitation for Task 6

The current test setup is Node's built-in test runner with TypeScript stripping only; it has no DOM renderer, touch-event emulator, or browser automation dependency. No dependency was added. Consequently the following must be verified in Task 6 with touch-capable local browser automation and, before release, the specified iOS Safari gate:

- 71px cancellation and 72px armed/reload boundary in the rendered component;
- one document navigation/reload and Strict Mode frame cleanup;
- fixed header geometry and 60px content offset;
- activation-before/after multitouch and touchcancel;
- interactive targets, `pre`, and inner scroll/code horizontal-scroll exclusions;
- DOM `data-pull-phase`/`data-pull-offset`, console, and navigation/network evidence.

## Self-review

- Reviewed the Task 3 brief and approved design contract after implementation.
- Confirmed no Task 4 control behavior or Task 5/TOC edits are included.
- Confirmed changed paths are limited to Task 3 frontend code/tests/CSS and this requested report.
