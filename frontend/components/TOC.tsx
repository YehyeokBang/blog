"use client";

import { useEffect, useState, useRef } from "react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export default function TOC() {
  const [headings, setHeadings] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const clickLockedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll("article h1, article h2")
    ).filter((elem) => !elem.closest("blockquote")) as HTMLElement[];

    const items: TOCItem[] = elements
      .map((elem) => ({
        id: elem.id,
        text: elem.textContent || "",
        level: Number(elem.tagName.charAt(1)),
      }))
      .filter((item) => item.id);

    setHeadings(items);

    if (items.length === 0) return;

    /**
     * 알고리즘: 비례 압축(Proportional Threshold Compression) + 역방향 탐색
     *
     * 문제 상황:
     *   짧은 페이지에서 maxScroll이 작으면, 마지막 몇 개의 헤딩은 고정 OFFSET
     *   기준선을 통과할 만큼 스크롤할 수 없다.
     *   기존의 isAtBottom 강제 점프는 중간 헤딩을 통째로 건너뛰는 버그를 낳는다.
     *
     * 해결 방법:
     *   각 헤딩의 "자연 threshold"(헤딩이 기준선 위치에 도달하는 scrollY)를 계산한다.
     *   마지막 헤딩의 자연 threshold가 maxScroll을 초과하면,
     *   모든 threshold를 maxScroll 내에 비례 압축(scale)한다.
     *   → 짧은 페이지에서도 모든 헤딩이 하나씩 순서대로 활성화된다.
     *   → isAtBottom 강제 점프 불필요.
     */
    const NAVBAR_HEIGHT = 96; // 네비바 + 여백 (px)

    function computeThresholds(): number[] {
      const maxScroll = Math.max(
        document.body.scrollHeight - window.innerHeight,
        0
      );

      // 각 헤딩의 자연 threshold: 그 헤딩이 NAVBAR_HEIGHT 위치에 오는 scrollY 값
      const natural = elements.map((el) =>
        Math.max(0, el.offsetTop - NAVBAR_HEIGHT)
      );

      // 페이지가 짧아서 마지막 헤딩의 threshold가 maxScroll을 넘으면
      // 전체를 비례 압축하여 [0, maxScroll] 안에 맞춤
      const lastNatural = natural[natural.length - 1];
      if (maxScroll > 0 && lastNatural > maxScroll) {
        const scale = maxScroll / lastNatural;
        return natural.map((t) => t * scale);
      }

      return natural;
    }

    // thresholds는 resize 때 재계산하므로 let으로 선언
    let thresholds = computeThresholds();

    function getActiveId(): string {
      const scrollY = window.scrollY;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (scrollY >= thresholds[i]) {
          return items[i].id;
        }
      }
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

    function onResize() {
      // 뷰포트 크기가 바뀌면 threshold 재계산
      thresholds = computeThresholds();
      setActiveId(getActiveId());
    }

    setActiveId(getActiveId());

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="toc-container text-[14px]">
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

                document.getElementById(heading.id)?.scrollIntoView({
                  behavior: "smooth",
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
