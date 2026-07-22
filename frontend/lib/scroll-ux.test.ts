import assert from "node:assert/strict";
import test from "node:test";
import {
  getPullRefreshPhase,
  getPullVisualOffset,
  getScrollBehavior,
  isPullActivationMove,
  PULL_REFRESH_MAX_OFFSET_PX,
  PULL_REFRESH_THRESHOLD_PX,
  shouldShowBackToTop,
  shouldStickToc,
} from "./scroll-ux.ts";

test("당김 거리는 음수를 0으로 제한하고 72px에서 armed로 전환한다", () => {
  assert.equal(PULL_REFRESH_THRESHOLD_PX, 72);
  assert.equal(getPullVisualOffset(-1), 0);
  assert.equal(getPullVisualOffset(0), 0);
  assert.equal(getPullRefreshPhase(-1), "pulling");
  assert.equal(getPullRefreshPhase(0), "pulling");
  assert.equal(getPullRefreshPhase(71), "pulling");
  assert.equal(getPullRefreshPhase(72), "armed");
});

test("당김 위치는 0.55 저항을 적용하고 96px로 제한한다", () => {
  assert.ok(Math.abs(getPullVisualOffset(71) - 39.05) < 0.000001);
  assert.ok(Math.abs(getPullVisualOffset(72) - 39.6) < 0.000001);
  assert.ok(Math.abs(getPullVisualOffset(100) - 55) < 0.000001);
  assert.equal(PULL_REFRESH_MAX_OFFSET_PX, 96);
  assert.equal(getPullVisualOffset(200), 96);
});

test("첫 move는 아래 방향이면서 수직 우세일 때만 custom pull을 활성화한다", () => {
  assert.equal(isPullActivationMove(0, 1), true);
  assert.equal(isPullActivationMove(20, 21), true);
  assert.equal(isPullActivationMove(20, 20), false);
  assert.equal(isPullActivationMove(21, 20), false);
  assert.equal(isPullActivationMove(0, -1), false);
});

test("스크롤 이동은 reduced motion에서 즉시 이동한다", () => {
  assert.equal(getScrollBehavior(), "smooth");
  assert.equal(getScrollBehavior(false), "smooth");
  assert.equal(getScrollBehavior(true), "auto");
});

test("상세 top control은 article header가 fixed header 위로 사라진 뒤에만 표시한다", () => {
  assert.equal(shouldShowBackToTop(true, 59, 100), false);
  assert.equal(shouldShowBackToTop(false, 61, 100), false);
  assert.equal(shouldShowBackToTop(false, 60, 0), false);
  assert.equal(shouldShowBackToTop(false, 60, 1), true);
});

test("TOC는 viewport 높이에서 120px를 뺀 경계까지 sticky로 유지한다", () => {
  assert.equal(shouldStickToc(680, 800), true);
  assert.equal(shouldStickToc(681, 800), false);
});
