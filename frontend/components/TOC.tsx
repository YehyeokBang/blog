"use client";

import { useEffect, useState, useRef } from "react";
import { getScrollBehavior, shouldStickToc } from "@/lib/scroll-ux";
import { useContentScrollContainer } from "./ContentScrollContext";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TOCProps {
  variant: "inline" | "sidebar";
  contentVersion?: number;
}

export default function TOC({ variant, contentVersion = 0 }: TOCProps) {
  const scrollContainer = useContentScrollContainer();
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isSticky, setIsSticky] = useState(false);
  const clickLockedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // id가 없는 헤딩은 TOC에 표시하지 않으므로, elements도 동일하게 필터링
    // → thresholds[i]와 items[i]가 항상 같은 헤딩을 가리키도록 보장
    if (!scrollContainer) {
      return;
    }
    const activeScrollContainer = scrollContainer;

    const elements = Array.from(
      document.querySelectorAll("article h1, article h2")
    )
      .filter((elem) => !elem.closest("blockquote") && (elem as HTMLElement).id)
      .map((elem) => elem as HTMLElement);

    const items: TOCItem[] = elements.map((elem) => ({
      id: elem.id,
      text: elem.textContent || "",
      level: Number(elem.tagName.charAt(1)),
    }));

    if (items.length === 0) return;

    // effect 본문에서 setState를 동기 호출하면 cascading render 경고 발생
    // (react-hooks/set-state-in-effect 린트 규칙)
    // → setTimeout 콜백 안에서 호출해 비동기로 처리
    const headingTimer = setTimeout(() => setHeadings(items), 0);

    /**
     * 알고리즘: 자연 threshold + 마지막 헤딩 한정 isAtBottom
     *
     * 핵심 원칙:
     *   각 헤딩의 threshold = heading.offsetTop - NAVBAR_HEIGHT
     *   (그 헤딩이 내비바 아래 기준선에 도달하는 scrollY)
     *
     *   이 값이 maxScroll보다 작으면 → 자연스럽게 활성화됨 (정확한 위치 추적)
     *   이 값이 maxScroll보다 크면  → 도달 불가. 마지막 헤딩만 특별 처리.
     *
     * 마지막 헤딩 처리:
     *   페이지 맨 끝(maxScroll)에 도달했을 때 마지막 헤딩을 강제 활성화.
     *   짧은 본문에서 마지막 헤딩이 기준선까지 올라올 수 없는 경우를 커버.
     *   단, 이 처리는 마지막 헤딩 하나에만 적용 → 중간 건너뜀 없음.
     *
     * 이전 "압축" 방식의 문제:
     *   도달 불가한 여러 헤딩의 threshold를 좁은 scroll 범위에 밀어넣으면
     *   조금만 스크롤해도 여러 헤딩이 한꺼번에 활성화되어 건너뛰는 것처럼 보임.
     */
    const NAVBAR_HEIGHT = 96; // 내비바 + 여백 (px)

    function getActiveId(): string {
      const scrollY = activeScrollContainer.scrollTop;
      const maxScroll = activeScrollContainer.scrollHeight - activeScrollContainer.clientHeight;
      const scrollTop = activeScrollContainer.getBoundingClientRect().top;

      // 페이지 맨 끝: 마지막 헤딩 활성화
      if (maxScroll > 0 && scrollY >= maxScroll - 4) {
        return items[items.length - 1].id;
      }

      // 역방향 탐색: 기준선을 이미 지난 헤딩 중 가장 마지막 것
      for (let i = elements.length - 1; i >= 0; i--) {
        if (elements[i].getBoundingClientRect().top <= scrollTop + NAVBAR_HEIGHT) {
          return items[i].id;
        }
      }

      // 아직 아무 헤딩도 지나치지 않았으면 첫 헤딩
      return items[0].id;
    }

    function onScroll() {
      if (clickLockedRef.current) return;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setActiveId(getActiveId());
      });
    }

    setActiveId(getActiveId());

    activeScrollContainer.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      activeScrollContainer.removeEventListener("scroll", onScroll);
      clearTimeout(headingTimer);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [contentVersion, scrollContainer]);

  useEffect(() => {
    if (variant !== "sidebar" || headings.length === 0 || !window.ResizeObserver) {
      return;
    }

    const nav = navRef.current;
    if (!nav) {
      return;
    }

    let isMounted = true;
    const updateStickyState = () => {
      const nav = navRef.current;
      if (!isMounted || !nav) {
        return;
      }

      const nextIsSticky = shouldStickToc(nav.scrollHeight, window.innerHeight);
      setIsSticky((currentIsSticky) =>
        currentIsSticky === nextIsSticky ? currentIsSticky : nextIsSticky,
      );
    };

    const observer = new window.ResizeObserver(updateStickyState);
    observer.observe(nav);
    window.addEventListener("resize", updateStickyState);

    return () => {
      isMounted = false;
      observer.disconnect();
      window.removeEventListener("resize", updateStickyState);
    };
  }, [headings.length, variant]);

  if (headings.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className={`toc-container text-[14px] ${
        variant === "sidebar" && isSticky ? "sticky top-[100px]" : ""
      }`}
    >
      <h3 className="font-bold text-ink mb-4 uppercase text-xs tracking-wider">
        목차
      </h3>
      <ul className="flex flex-col gap-1.5">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block py-0.5 hover:text-primary transition-colors ${
                activeId === heading.id
                  ? "text-primary font-semibold"
                  : "text-muted"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveId(heading.id);

                // 클릭 직후 1초간 scroll 핸들러가 active를 덮어쓰지 않도록 잠금
                clickLockedRef.current = true;
                setTimeout(() => {
                  clickLockedRef.current = false;
                }, 1000);

                const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: getScrollBehavior(reducedMotion),
                });
              }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
