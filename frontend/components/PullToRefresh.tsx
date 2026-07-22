"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import {
  getPullProgress,
  getPullRefreshPhase,
  getPullVisualOffset,
  isPullActivationMove,
  PULL_REFRESH_THRESHOLD_PX,
  type PullRefreshPhase,
} from "@/lib/scroll-ux";

interface PullToRefreshProps {
  children: ReactNode;
}

interface PullStart {
  identifier: number;
  x: number;
  y: number;
}

interface PendingPullUpdate {
  rawDistance: number;
}

const INTERACTIVE_TARGET_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "[contenteditable]",
  "pre",
  "[data-pull-refresh-ignore]",
].join(", ");

function isScrollable(value: string): boolean {
  return value === "auto" || value === "scroll";
}

function isExcludedPullTarget(target: EventTarget | null, surface: HTMLElement): boolean {
  if (!(target instanceof Element)) {
    return true;
  }

  if (target.closest(INTERACTIVE_TARGET_SELECTOR)) {
    return true;
  }

  let current: Element | null = target;
  while (current) {
    const style = window.getComputedStyle(current);
    if (
      isScrollable(style.overflow) ||
      isScrollable(style.overflowX) ||
      isScrollable(style.overflowY)
    ) {
      return true;
    }

    if (current === surface) {
      break;
    }

    current = current.parentElement;
  }

  return false;
}

function findTouch(touches: TouchList, identifier: number): Touch | null {
  return Array.from(touches).find((touch) => touch.identifier === identifier) ?? null;
}

function getPullRefreshCapability(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.CSS?.supports("overscroll-behavior-y", "contain") &&
    window.matchMedia?.("(pointer: coarse)").matches &&
    navigator.maxTouchPoints > 0,
  );
}

function subscribeToPullRefreshCapability(onStoreChange: () => void): () => void {
  const frame = window.requestAnimationFrame(onStoreChange);
  return () => window.cancelAnimationFrame(frame);
}

function PullRefreshIndicator({
  phase,
  progress,
}: {
  phase: Exclude<PullRefreshPhase, "idle">;
  progress: number;
}) {
  const text = phase === "pulling"
    ? "아래로 당겨 새로고침"
    : phase === "armed"
      ? "놓으면 새로고침"
      : "새로고침 중";

  return (
    <div
      className="pull-refresh-indicator"
      data-pull-refresh-indicator={phase}
      role="status"
      aria-live="polite"
      aria-busy={phase === "refreshing" ? true : undefined}
    >
      <svg
        className="pull-refresh-indicator-ring"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        focusable="false"
      >
        <circle className="pull-refresh-indicator-ring-track" cx="14" cy="14" r="11" />
        <circle
          className="pull-refresh-indicator-ring-progress"
          cx="14"
          cy="14"
          r="11"
          pathLength="1"
          strokeDasharray={`${progress} 1`}
        />
      </svg>
      <span>{text}</span>
    </div>
  );
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<PullStart | null>(null);
  const activatedRef = useRef(false);
  const rawDistanceRef = useRef(0);
  const pendingUpdateRef = useRef<PendingPullUpdate | null>(null);
  const moveFrameRef = useRef<number | null>(null);
  const reloadFrameRef = useRef<number | null>(null);
  const reloadStartedRef = useRef(false);
  const phaseRef = useRef<PullRefreshPhase>("idle");
  const enabled = useSyncExternalStore(
    subscribeToPullRefreshCapability,
    getPullRefreshCapability,
    () => false,
  );
  const [phase, setPhase] = useState<PullRefreshPhase>("idle");
  const [pullDistance, setPullDistance] = useState(0);
  const [visualOffset, setVisualOffset] = useState(0);

  const updatePhase = useCallback((nextPhase: PullRefreshPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const cancelMoveFrame = useCallback(() => {
    if (moveFrameRef.current !== null) {
      window.cancelAnimationFrame(moveFrameRef.current);
      moveFrameRef.current = null;
    }
    pendingUpdateRef.current = null;
  }, []);

  const resetPull = useCallback(() => {
    cancelMoveFrame();
    startRef.current = null;
    activatedRef.current = false;
    rawDistanceRef.current = 0;
    setPullDistance(0);
    setVisualOffset(0);
    updatePhase("idle");
  }, [cancelMoveFrame, updatePhase]);

  const schedulePullUpdate = useCallback((rawDistance: number) => {
    rawDistanceRef.current = rawDistance;
    pendingUpdateRef.current = { rawDistance };

    if (moveFrameRef.current !== null) {
      return;
    }

    moveFrameRef.current = window.requestAnimationFrame(() => {
      moveFrameRef.current = null;
      const pendingUpdate = pendingUpdateRef.current;
      pendingUpdateRef.current = null;

      if (!pendingUpdate || !activatedRef.current) {
        return;
      }

      setPullDistance(pendingUpdate.rawDistance);
      setVisualOffset(getPullVisualOffset(pendingUpdate.rawDistance));
      updatePhase(getPullRefreshPhase(pendingUpdate.rawDistance));
    });
  }, [updatePhase]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    document.documentElement.dataset.pullRefresh = "enabled";

    return () => {
      delete document.documentElement.dataset.pullRefresh;
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || phase !== "refreshing") {
      return;
    }

    reloadFrameRef.current = window.requestAnimationFrame(() => {
      reloadFrameRef.current = null;
      if (reloadStartedRef.current) {
        return;
      }

      reloadStartedRef.current = true;
      window.location.reload();
    });

    return () => {
      if (reloadFrameRef.current !== null) {
        window.cancelAnimationFrame(reloadFrameRef.current);
        reloadFrameRef.current = null;
      }
    };
  }, [enabled, phase]);

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!enabled || !surface) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (phaseRef.current === "refreshing" || window.scrollY !== 0 || event.touches.length !== 1) {
        startRef.current = null;
        return;
      }

      if (isExcludedPullTarget(event.target, surface)) {
        startRef.current = null;
        return;
      }

      const touch = event.touches[0];
      startRef.current = { identifier: touch.identifier, x: touch.clientX, y: touch.clientY };
      activatedRef.current = false;
      rawDistanceRef.current = 0;
    };

    const handleTouchMove = (event: TouchEvent) => {
      const start = startRef.current;
      if (!start || phaseRef.current === "refreshing") {
        return;
      }

      if (event.touches.length !== 1) {
        if (activatedRef.current) {
          resetPull();
        } else {
          startRef.current = null;
        }
        return;
      }

      const touch = findTouch(event.touches, start.identifier);
      if (!touch) {
        if (activatedRef.current) {
          resetPull();
        } else {
          startRef.current = null;
        }
        return;
      }

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (!activatedRef.current) {
        if (!isPullActivationMove(deltaX, deltaY)) {
          startRef.current = null;
          return;
        }

        activatedRef.current = true;
      } else if (!isPullActivationMove(deltaX, deltaY)) {
        resetPull();
        return;
      }

      event.preventDefault();
      schedulePullUpdate(deltaY);
    };

    const handleTouchEnd = () => {
      if (!activatedRef.current) {
        startRef.current = null;
        return;
      }

      const rawDistance = rawDistanceRef.current;
      cancelMoveFrame();
      startRef.current = null;
      activatedRef.current = false;

      if (rawDistance < PULL_REFRESH_THRESHOLD_PX) {
        resetPull();
        return;
      }

      setPullDistance(rawDistance);
      setVisualOffset(getPullVisualOffset(rawDistance));
      updatePhase("refreshing");
    };

    const handleTouchCancel = () => {
      resetPull();
    };

    surface.addEventListener("touchstart", handleTouchStart, { passive: true });
    surface.addEventListener("touchmove", handleTouchMove, { passive: false });
    surface.addEventListener("touchend", handleTouchEnd, { passive: true });
    surface.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      surface.removeEventListener("touchstart", handleTouchStart);
      surface.removeEventListener("touchmove", handleTouchMove);
      surface.removeEventListener("touchend", handleTouchEnd);
      surface.removeEventListener("touchcancel", handleTouchCancel);
      resetPull();
    };
  }, [cancelMoveFrame, enabled, resetPull, schedulePullUpdate, updatePhase]);

  useEffect(() => {
    return () => {
      cancelMoveFrame();
      if (reloadFrameRef.current !== null) {
        window.cancelAnimationFrame(reloadFrameRef.current);
      }
    };
  }, [cancelMoveFrame]);

  const surfaceStyle: CSSProperties | undefined = phase === "idle"
    ? undefined
    : {
        transform: `translate3d(0, ${visualOffset}px, 0)`,
        willChange: "transform",
      };
  const pullProgress = getPullProgress(pullDistance);

  return (
    <div
      ref={surfaceRef}
      className="pull-refresh-surface pt-[60px]"
      data-pull-phase={enabled ? phase : undefined}
      data-pull-offset={enabled ? visualOffset : undefined}
      style={surfaceStyle}
    >
      {enabled && phase !== "idle" ? <PullRefreshIndicator phase={phase} progress={pullProgress} /> : null}
      {children}
    </div>
  );
}
