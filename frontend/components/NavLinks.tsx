"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLinks() {
  const pathname = usePathname();
  
  const isArticlesActive = pathname === "/" || pathname.startsWith("/posts");
  const isAboutActive = pathname === "/about";

  return (
    <>
      <Link 
        href="/" 
        className={`text-[15px] transition-all ${
          isArticlesActive 
            ? "font-semibold text-ink hover:opacity-80" 
            : "font-medium text-muted hover:text-ink"
        }`}
      >
        아티클
      </Link>
      <Link 
        href="/about" 
        className={`text-[15px] transition-all ${
          isAboutActive 
            ? "font-semibold text-ink hover:opacity-80" 
            : "font-medium text-muted hover:text-ink"
        }`}
      >
        소개
      </Link>
    </>
  );
}
