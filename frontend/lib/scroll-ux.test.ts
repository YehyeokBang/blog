import assert from "node:assert/strict";
import test from "node:test";
import {
  getPullRefreshPhase,
  getPullVisualOffset,
  getScrollBehavior,
  PULL_REFRESH_MAX_OFFSET_PX,
  PULL_REFRESH_THRESHOLD_PX,
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

test("스크롤 이동은 reduced motion에서 즉시 이동한다", () => {
  assert.equal(getScrollBehavior(false), "smooth");
  assert.equal(getScrollBehavior(true), "auto");
});

test("TOC는 viewport 높이에서 120px를 뺀 경계까지 sticky로 유지한다", () => {
  assert.equal(shouldStickToc(680, 800), true);
  assert.equal(shouldStickToc(681, 800), false);
});
