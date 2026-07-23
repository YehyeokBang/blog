"use client";

import HeaderHomeLink from "./HeaderHomeLink";
import NavLinks from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="relative z-50 h-[var(--site-header-height)] shrink-0 bg-canvas/80 backdrop-blur-md border-b border-hairline-soft">
      <div className="max-w-[1000px] mx-auto h-[var(--site-header-height)] px-6 md:px-lg flex items-center justify-between">
        <HeaderHomeLink />
        <nav className="flex items-center gap-lg">
          <NavLinks />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
