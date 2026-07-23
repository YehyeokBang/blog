"use client";

import { createContext, useContext, type ReactNode } from "react";

const ContentScrollContext = createContext<HTMLElement | null>(null);

export function ContentScrollProvider({
  children,
  scrollContainer,
}: {
  children: ReactNode;
  scrollContainer: HTMLElement | null;
}) {
  return (
    <ContentScrollContext.Provider value={scrollContainer}>
      {children}
    </ContentScrollContext.Provider>
  );
}

export function useContentScrollContainer() {
  return useContext(ContentScrollContext);
}
