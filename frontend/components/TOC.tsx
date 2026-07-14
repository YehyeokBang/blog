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
    // id가 없는 헤딩은 TOC에 표시하지 않으므로, elements도 동일하게 필터링
    // → thresholds[i]와 items[i]가 항상 같은 헤딩을 가리키도록 보장
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

    setHeadings(items);

    if (items.length === 0) return;

    /**
     * 알고리즘: 선택적 오버플로우 압축(Selective Overflow Compression) + 역방향 탐색
     *
     * 문제 상황:
     *   짧은 페이지에서는 마지막 몇 개 헤딩이 maxScroll을 넘어 도달 불가능해진다.
     *   → 이전 "전체 비례 압축"은 모든 threshold를 줄여서, 긴 페이지에서도
     *     이미 도달 가능한 헤딩들이 너무 일찍 활성화되는 부작용이 있었다.
     *
     * 해결 방법:
     *   1. 각 헤딩의 "자연 threshold"(헤딩이 기준선에 도달하는 scrollY)를 계산한다.
     *   2. maxScroll 이하 헤딩 → 자연 threshold 그대로 사용 (정확한 위치 유지).
     *   3. maxScroll 초과 헤딩(도달 불가) → 선행 헤딩의 threshold ~ maxScroll 범위에
     *      균등하게 배분한다.
     *   → 정확도(긴 페이지)와 완전성(짧은 페이지) 모두 확보.
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

      const lastNatural = natural[natural.length - 1];

      // 모든 헤딩이 도달 가능하면 자연 threshold 그대로 반환
      if (maxScroll <= 0 || lastNatural <= maxScroll) {
        return natural;
      }

      // maxScroll을 초과하는 첫 번째 헤딩의 인덱스를 찾는다
      const overflowStart = natural.findIndex((t) => t > maxScroll);

      // overflowStart 이전 헤딩들은 자연 threshold 유지
      // overflowStart 이후 헤딩들은 [anchorThreshold, maxScroll] 범위에 균등 배분
      const anchorThreshold =
        overflowStart > 0 ? natural[overflowStart - 1] : 0;
      const overflowCount = natural.length - overflowStart;
      const range = maxScroll - anchorThreshold;

      return natural.map((t, i) => {
        if (i < overflowStart) return t; // 도달 가능 헤딩: 자연 threshold 유지
        const fraction = (i - overflowStart + 1) / overflowCount;
        return anchorThreshold + fraction * range;
      });
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
