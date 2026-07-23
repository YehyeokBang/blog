"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

type RefreshHandler = () => Promise<void>;

interface ContentRefreshContextValue {
  refreshContent: () => Promise<void>;
  registerRefreshHandler: (handler: RefreshHandler) => () => void;
}

const ContentRefreshContext = createContext<ContentRefreshContextValue | null>(null);

export function ContentRefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<RefreshHandler | null>(null);

  const refreshContent = useCallback(async () => {
    await handlerRef.current?.();
  }, []);

  const registerRefreshHandler = useCallback((handler: RefreshHandler) => {
    handlerRef.current = handler;

    return () => {
      if (handlerRef.current === handler) {
        handlerRef.current = null;
      }
    };
  }, []);

  return (
    <ContentRefreshContext.Provider value={{ refreshContent, registerRefreshHandler }}>
      {children}
    </ContentRefreshContext.Provider>
  );
}

export function useContentRefresh() {
  const context = useContext(ContentRefreshContext);
  if (!context) {
    throw new Error("useContentRefresh must be used within ContentRefreshProvider.");
  }

  return context;
}
