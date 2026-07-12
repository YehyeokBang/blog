"use client";

import { useEffect, useRef } from "react";
import { Check, Copy } from "lucide-react";

export default function PostContent({ content }: { content: string }) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // shiki generates code blocks like <figure data-rehype-pretty-code-figure><pre>...</pre></figure>
    // or just <pre>. We'll find all pre elements or figures.
    const figures = contentRef.current.querySelectorAll("figure[data-rehype-pretty-code-figure]");

    figures.forEach((figure) => {
      // Avoid adding multiple buttons if effect runs again
      if (figure.querySelector(".copy-btn-container")) return;

      const pre = figure.querySelector("pre");
      if (!pre) return;

      // Extract language from figure or pre attributes
      const lang = figure.getAttribute("data-language") || pre.getAttribute("data-language") || "";

      // Container for our absolute elements just to mark that we processed this figure
      const marker = document.createElement("div");
      marker.className = "copy-btn-container"; 
      
      const langSpan = document.createElement("span");
      // Sleek, minimal language badge floating on the top left
      langSpan.className = "absolute top-4 left-5 font-mono font-bold uppercase text-[11px] text-muted-soft select-none pointer-events-none tracking-wider";
      langSpan.textContent = lang;

      const copyBtn = document.createElement("button");
      // Sleek, dark-mode adapted copy button on the top right
      copyBtn.className = "absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-soft hover:text-white border border-transparent hover:border-white/10 transition-all focus:outline-none backdrop-blur-sm z-10";
      
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;
      
      copyBtn.innerHTML = `${copyIcon}<span class="text-[11px] font-medium tracking-wide">복사</span>`;
      
      copyBtn.addEventListener("click", () => {
        const codeElement = pre.querySelector("code");
        if (codeElement) {
          navigator.clipboard.writeText(codeElement.innerText).then(() => {
            copyBtn.classList.replace("text-muted-soft", "text-green-400");
            copyBtn.classList.replace("hover:text-white", "hover:text-green-400");
            copyBtn.innerHTML = `${checkIcon}<span class="text-[11px] font-medium tracking-wide">완료</span>`;
            setTimeout(() => {
              copyBtn.classList.replace("text-green-400", "text-muted-soft");
              copyBtn.classList.replace("hover:text-green-400", "hover:text-white");
              copyBtn.innerHTML = `${copyIcon}<span class="text-[11px] font-medium tracking-wide">복사</span>`;
            }, 2000);
          });
        }
      });

      figure.appendChild(marker);
      figure.appendChild(langSpan);
      figure.appendChild(copyBtn);
    });
  }, [content]);

  return (
    <div
      ref={contentRef}
      className="post-content w-full"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
