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
    // Find all headings inside article, exclude h3+ and blockquote children
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
     * 업계 표준: scroll + 역방향 탐색(reverse iteration) 알고리즘
     *
     * 동작 원리:
     *  1. 헤딩들을 역순으로 순회하면서, 현재 scrollY 기준으로
     *     "이미 지나친 헤딩" 중 가장 마지막 것을 active로 설정.
     *  2. 스크롤이 페이지 맨 끝에 도달하면 마지막 헤딩을 강제 활성화.
     *     → 짧은 본문에서 마지막 헤딩 하이라이팅이 멈추는 버그 해결.
     *
     * IntersectionObserver 대신 scroll 이벤트를 쓰는 이유:
     *  IO는 헤딩이 viewport를 완전히 벗어나면 콜백 발화 자체가 안 되므로
     *  짧은 페이지의 마지막 섹션 문제를 근본적으로 해결하기 어렵다.
     *  scroll 이벤트는 requestAnimationFrame으로 스로틀링해 성능을 확보한다.
     */
    const OFFSET = 96; // 헤딩이 여기(px, 뷰포트 상단 기준)에 도달하면 active로 판정

    function getActiveId(): string {
      // 페이지 맨 끝 체크: 더 이상 스크롤할 수 없으면 마지막 헤딩 활성화
      const isAtBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 4;
      if (isAtBottom) {
        return items[items.length - 1].id;
      }

      // 역방향 탐색: 위에서 OFFSET px 아래 기준점을 이미 지난 헤딩 중 가장 마지막 것
      for (let i = elements.length - 1; i >= 0; i--) {
        const top = elements[i].getBoundingClientRect().top;
        if (top <= OFFSET) {
          return items[i].id;
        }
      }

      // 아직 아무 헤딩도 지나치지 않았으면(페이지 최상단) 첫 헤딩 활성화
      return items[0].id;
    }

    function onScroll() {
      if (clickLockedRef.current) return;
      if (rafRef.current !== null) return; // 이미 RAF 예약됨

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setActiveId(getActiveId());
      });
    }

    // 초기 렌더 시 한 번 실행
    setActiveId(getActiveId());

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
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
