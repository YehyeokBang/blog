export const PULL_REFRESH_THRESHOLD_PX = 72;
export const PULL_REFRESH_MAX_OFFSET_PX = 96;

export type PullRefreshPhase = "idle" | "pulling" | "armed" | "refreshing";

export interface PullRefreshState {
  phase: PullRefreshPhase;
  startY: number | null;
  rawDistance: number;
  visualOffset: number;
}

export function getPullVisualOffset(rawDistance: number): number {
  return Math.min(Math.max(rawDistance, 0) * 0.55, PULL_REFRESH_MAX_OFFSET_PX);
}

export function getPullProgress(rawDistance: number): number {
  return Math.min(Math.max(rawDistance / PULL_REFRESH_THRESHOLD_PX, 0), 1);
}

export function getPullRefreshPhase(rawDistance: number): "pulling" | "armed" {
  return rawDistance >= PULL_REFRESH_THRESHOLD_PX ? "armed" : "pulling";
}

export function isPullActivationMove(deltaX: number, deltaY: number): boolean {
  return deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);
}

export function getScrollBehavior(reducedMotion = false): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth";
}

export function shouldShowBackToTop(
  headerIsIntersecting: boolean,
  headerBottom: number,
  scrollY: number,
): boolean {
  return !headerIsIntersecting && headerBottom <= 60 && scrollY > 0;
}

export function shouldStickToc(contentHeight: number, viewportHeight: number): boolean {
  return contentHeight <= viewportHeight - 120;
}
