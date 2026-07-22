"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { getScrollBehavior, shouldShowBackToTop } from "@/lib/scroll-ux";

export default function BackToTopButton() {
  const pathname = usePathname();
  const [visiblePathname, setVisiblePathname] = useState<string | null>(null);
  const isPostRoute = pathname.startsWith("/posts/");
  const isVisible = visiblePathname === pathname;

  useEffect(() => {
    if (!isPostRoute) {
      return;
    }

    const articleHeader = document.getElementById("article-header");
    if (!articleHeader) {
      return;
    }

    const updateVisibility = (headerIsIntersecting: boolean) => {
      const shouldShow = shouldShowBackToTop(
        headerIsIntersecting,
        articleHeader.getBoundingClientRect().bottom,
        window.scrollY,
      );
      setVisiblePathname(shouldShow ? pathname : null);
    };

    if (typeof window.IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        ([entry]) => updateVisibility(entry.isIntersecting),
        { rootMargin: "-60px 0px 0px 0px", threshold: 0 },
      );

      observer.observe(articleHeader);
      return () => observer.disconnect();
    }

    let animationFrame: number | null = null;
    const updateOnScroll = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = null;
        updateVisibility(false);
      });
    };

    window.addEventListener("scroll", updateOnScroll, { passive: true });
    updateOnScroll();

    return () => {
      window.removeEventListener("scroll", updateOnScroll);
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [isPostRoute, pathname]);

  const handleClick = () => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: getScrollBehavior(reducedMotion) });
  };

  if (!isPostRoute || !isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      className="back-to-top-button"
      aria-label="맨 위로 이동"
      onClick={handleClick}
    >
      <ArrowUp aria-hidden="true" size={18} strokeWidth={2} />
    </button>
  );
}
