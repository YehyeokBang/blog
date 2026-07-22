"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
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
  progressRef,
}: {
  phase: PullRefreshPhase;
  progressRef: RefObject<SVGCircleElement | null>;
}) {
  const isIdle = phase === "idle";
  const text = phase === "pulling"
    ? "아래로 당겨 새로고침"
    : phase === "armed"
      ? "놓으면 새로고침"
      : "새로고침 중";

  return (
    <div
      className="pull-refresh-indicator"
      data-pull-refresh-indicator={phase}
      role={isIdle ? undefined : "status"}
      aria-live={isIdle ? undefined : "polite"}
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
          ref={progressRef}
          className="pull-refresh-indicator-ring-progress"
          cx="14"
          cy="14"
          r="11"
          pathLength="1"
        />
      </svg>
      <span>{text}</span>
    </div>
  );
}

export default function PullToRefresh({ children }: PullToRefreshProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
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

  const updatePhase = useCallback((nextPhase: PullRefreshPhase) => {
    if (phaseRef.current === nextPhase) {
      return;
    }

    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const applyPullVisuals = useCallback((rawDistance: number) => {
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.transform = `translate3d(0, ${getPullVisualOffset(rawDistance)}px, 0)`;
      surface.style.willChange = "transform";
    }

    progressRef.current?.style.setProperty("--pull-progress", String(getPullProgress(rawDistance)));
  }, []);

  const clearPullVisuals = useCallback(() => {
    const surface = surfaceRef.current;
    if (surface) {
      surface.style.removeProperty("transform");
      surface.style.removeProperty("will-change");
    }

    progressRef.current?.style.setProperty("--pull-progress", "0");
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
    clearPullVisuals();
    updatePhase("idle");
  }, [cancelMoveFrame, clearPullVisuals, updatePhase]);

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

      applyPullVisuals(pendingUpdate.rawDistance);
      updatePhase(getPullRefreshPhase(pendingUpdate.rawDistance));
    });
  }, [applyPullVisuals, updatePhase]);

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

      applyPullVisuals(rawDistance);
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
  }, [applyPullVisuals, cancelMoveFrame, enabled, resetPull, schedulePullUpdate, updatePhase]);

  useEffect(() => {
    return () => {
      cancelMoveFrame();
      if (reloadFrameRef.current !== null) {
        window.cancelAnimationFrame(reloadFrameRef.current);
      }
    };
  }, [cancelMoveFrame]);

  return (
    <>
      {enabled ? <PullRefreshIndicator phase={phase} progressRef={progressRef} /> : null}
      <div
        ref={surfaceRef}
        className="pull-refresh-surface pt-[60px]"
        data-pull-phase={enabled ? phase : undefined}
      >
        {children}
      </div>
    </>
  );
}
