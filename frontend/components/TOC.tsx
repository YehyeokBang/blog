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
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const headingElementsRef = useRef<Record<string, IntersectionObserverEntry>>({});

  useEffect(() => {
    // Find all headings inside post-content
    // Exclude h3 to keep TOC concise and avoid scrolling, and exclude blockquotes
    const elements = Array.from(document.querySelectorAll("article h1, article h2"))
      .filter((elem) => !elem.closest("blockquote"));

    const items: TOCItem[] = elements.map((elem) => ({
      id: elem.id,
      text: elem.textContent || "",
      level: Number(elem.tagName.charAt(1)),
    })).filter(item => item.id); // only headings with ids (added by rehype-slug)

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          headingElementsRef.current[entry.target.id] = entry;
        });

        // Ignore observer updates if a TOC link was recently clicked (smooth scrolling)
        if (clickTimeoutRef.current) return;

        const visibleHeadings = items.filter(
          (item) => headingElementsRef.current[item.id]?.isIntersecting
        );

        if (visibleHeadings.length > 0) {
          // If the currently active heading is still visible, keep it.
          // Otherwise, highlight the first visible heading.
          const isActiveVisible = visibleHeadings.some((h) => h.id === activeIdRef.current);
          if (!isActiveVisible) {
            const newActiveId = visibleHeadings[0].id;
            setActiveId(newActiveId);
          }
        }
      },
      // intersection window: from 80px below top, down to bottom of screen
      { rootMargin: "-80px 0px 0px 0px" }
    );

    elements.forEach((elem) => {
      if (elem.id) observer.observe(elem);
    });

    return () => observer.disconnect();
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="toc-container text-[14px]">
      <h3 className="font-bold text-ink mb-4 uppercase text-xs tracking-wider">목차</h3>
      <ul className="flex flex-col gap-1.5">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block py-0.5 hover:text-primary transition-colors ${
                activeId === heading.id ? "text-primary font-semibold" : "text-muted"
              }`}
              onClick={(e) => {
                e.preventDefault();
                setActiveId(heading.id);
                if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
                clickTimeoutRef.current = setTimeout(() => {
                  clickTimeoutRef.current = null;
                }, 1000); // Wait 1 second for smooth scroll to finish
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
