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

export function getPullRefreshPhase(rawDistance: number): "pulling" | "armed" {
  return rawDistance >= PULL_REFRESH_THRESHOLD_PX ? "armed" : "pulling";
}

export function getScrollBehavior(reducedMotion = false): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth";
}

export function shouldStickToc(contentHeight: number, viewportHeight: number): boolean {
  return contentHeight <= viewportHeight - 120;
}
