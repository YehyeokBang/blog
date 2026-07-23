"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BackToTopButton from "./BackToTopButton";
import { ContentRefreshProvider, useContentRefresh } from "./ContentRefreshContext";
import { ContentScrollProvider } from "./ContentScrollContext";
import PullToRefresh from "./PullToRefresh";
import SiteHeader from "./SiteHeader";
import { isPullRefreshRoute, shouldResetContentScroll } from "@/lib/scroll-ux";

function ContentScrollShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { refreshContent } = useContentRefresh();
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const previousPathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (shouldResetContentScroll(previousPathnameRef.current, pathname)) {
      scrollContainer?.scrollTo({ top: 0, behavior: "auto" });
    }

    previousPathnameRef.current = pathname;
  }, [pathname, scrollContainer]);

  return (
    <ContentScrollProvider scrollContainer={scrollContainer}>
      <div className="content-scroll-shell">
        <SiteHeader />
        <PullToRefresh
          enabled={isPullRefreshRoute(pathname)}
          onRefresh={refreshContent}
          onScrollContainerChange={setScrollContainer}
        >
          {children}
        </PullToRefresh>
      </div>
      <BackToTopButton />
    </ContentScrollProvider>
  );
}

export default function ContentScrollShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ContentRefreshProvider>
      <ContentScrollShellBody>{children}</ContentScrollShellBody>
    </ContentRefreshProvider>
  );
}
