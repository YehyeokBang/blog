import assert from "node:assert/strict";
import test from "node:test";
import {
  getPullProgress,
  getPullRefreshPhase,
  getPullIndicatorOffset,
  getPullVisualOffset,
  getScrollBehavior,
  isPullRefreshRoute,
  isScrollContainerAtTop,
  isPullActivationMove,
  PULL_REFRESH_MAX_OFFSET_PX,
  PULL_REFRESH_THRESHOLD_PX,
  shouldShowBackToTop,
  shouldStickToc,
  shouldResetContentScroll,
} from "./scroll-ux.ts";

test("당김 진행률은 임계값까지 0과 1 사이로 제한한다", () => {
  assert.equal(getPullProgress(-1), 0);
  assert.equal(getPullProgress(0), 0);
  assert.equal(getPullProgress(36), 0.5);
  assert.equal(getPullProgress(72), 1);
  assert.equal(getPullProgress(120), 1);
});

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

test("프로그레스 링은 헤더와 당겨진 콘텐츠 사이의 중앙을 따라간다", () => {
  assert.equal(getPullIndicatorOffset(0), 16);
  assert.ok(Math.abs(getPullIndicatorOffset(72) - 35.8) < 0.000001);
  assert.equal(getPullIndicatorOffset(200), 64);
});

test("첫 move는 아래 방향이면서 수직 우세일 때만 custom pull을 활성화한다", () => {
  assert.equal(isPullActivationMove(0, 1), true);
  assert.equal(isPullActivationMove(20, 21), true);
  assert.equal(isPullActivationMove(20, 20), false);
  assert.equal(isPullActivationMove(21, 20), false);
  assert.equal(isPullActivationMove(0, -1), false);
});

test("당김 새로고침은 아티클 목록과 상세 경로에서만 제공한다", () => {
  assert.equal(isPullRefreshRoute("/"), true);
  assert.equal(isPullRefreshRoute("/posts/claude-code-rewind"), true);
  assert.equal(isPullRefreshRoute("/about"), false);
  assert.equal(isPullRefreshRoute("/unknown"), false);
});

test("콘텐츠 스크롤 영역이 맨 위일 때만 당김 새로고침을 시작할 수 있다", () => {
  assert.equal(isScrollContainerAtTop(0), true);
  assert.equal(isScrollContainerAtTop(0.1), false);
  assert.equal(isScrollContainerAtTop(24), false);
});

test("페이지 경로가 바뀌면 콘텐츠 스크롤을 맨 위로 초기화한다", () => {
  assert.equal(shouldResetContentScroll(null, "/"), false);
  assert.equal(shouldResetContentScroll("/", "/"), false);
  assert.equal(shouldResetContentScroll("/posts/claude-code-rewind", "/about"), true);
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
