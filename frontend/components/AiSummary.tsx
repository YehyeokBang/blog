"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type AiSummaryStatus = "idle" | "loading" | "complete" | "error";

interface AiSummaryProps {
  slug: string;
}

export default function AiSummary({ slug }: AiSummaryProps) {
  const [status, setStatus] = useState<AiSummaryStatus>("idle");
  const [summary, setSummary] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [animationKey, setAnimationKey] = useState(0);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setIsInfoOpen(false);
      }
    }
    if (isInfoOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isInfoOpen]);

  const generateSummary = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setStatus("loading");
    setSummary("");
    setErrorMessage("");
    setProgressMessage("");

    const es = new EventSource(`/api/posts/${slug}/ai-summary`);
    eventSourceRef.current = es;

    es.addEventListener("progress", (event) => {
      setProgressMessage((event as MessageEvent).data);
      setAnimationKey(prev => prev + 1);
    });

    es.addEventListener("delta", (event) => {
      setSummary((prev) => prev + (event as MessageEvent).data);
    });

    es.addEventListener("complete", () => {
      setStatus("complete");
      es.close();
    });
    
    // Also listen to custom error event
    es.addEventListener("error", (event) => {
      setStatus("error");
      try {
        const errorData = JSON.parse((event as MessageEvent).data);
        setErrorMessage(errorData.message || "요약 생성 중 오류가 발생했습니다.");
      } catch {
        setErrorMessage("요약 생성 중 오류가 발생했습니다.");
      }
      es.close();
      eventSourceRef.current = null;
    });

    // Native EventSource error (network error, etc)
    es.onerror = () => {
      if (eventSourceRef.current === es) {
        setStatus("error");
        setErrorMessage("서버 연결에 실패했습니다.");
        es.close();
        eventSourceRef.current = null;
      }
    };
  }, [slug]);

  useEffect(() => {
    // 자동 생성 시작
    let timer: NodeJS.Timeout;
    if (status === "idle") {
      timer = setTimeout(() => {
        generateSummary();
      }, 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [status, generateSummary]);

  const renderFormattedText = (text: string) => {
    const parts = text.split(/`([^`]+)`/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <code key={index} className="bg-surface-soft px-1.5 py-0.5 mx-0.5 rounded text-primary font-mono text-[0.9em] inline-block border border-hairline-soft">
            {part}
          </code>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const renderSummary = (text: string) => {
    if (!text) return null;
    const lines = text.split("\n").filter(line => line.trim() !== "");
    return (
      <ul className="list-disc list-outside pl-4 space-y-2 marker:text-primary/70">
        {lines.map((line, i) => {
          const cleanLine = line.replace(/^[•\-\*]\s*/, "");
          return <li key={i} className="pl-1">{renderFormattedText(cleanLine)}</li>;
        })}
      </ul>
    );
  };

  return (
    <div className="mb-lg p-md bg-surface-soft rounded-lg border border-hairline-soft">
      <div className="flex items-center justify-between mb-sm relative">
        <div className="flex items-center gap-2" ref={infoRef}>
          <h3 className="text-body-lg font-semibold text-ink flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary fill-primary/20">
              <path d="M12 2l2.4 7.6 7.6 2.4-7.6 2.4-2.4 7.6-2.4-7.6-7.6-2.4 7.6-2.4 2.4-7.6z" />
            </svg>
            AI 개요
          </h3>
          <button
            onClick={() => setIsInfoOpen(!isInfoOpen)}
            className="text-muted hover:text-ink transition-colors mt-0.5"
            title="AI 요약 안내"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>
          
          {isInfoOpen && (
            <div className="absolute top-8 left-0 w-[280px] sm:w-[320px] p-4 bg-canvas rounded-lg border border-hairline shadow-lg z-10">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-body-md text-ink">AI가 요약한 글이란?</h4>
                <button onClick={() => setIsInfoOpen(false)} className="text-muted hover:text-ink">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <ul className="text-body-sm text-body space-y-2 list-disc pl-4 marker:text-muted">
                <li>AI가 글을 분석하여 자동 생성한 요약으로, 기술 특성상 일부 오류나 누락이 있을 수 있습니다.</li>
                <li>긴 글을 읽기 전 핵심 내용을 빠르게 파악할 수 있도록 돕습니다.</li>
              </ul>
            </div>
          )}
        </div>
        {status === "error" && (
          <button
            onClick={generateSummary}
            className="px-3 py-1 bg-ink text-canvas text-[13px] font-medium rounded-md hover:bg-ink/80 transition-colors"
          >
            다시 시도
          </button>
        )}
      </div>

      {status === "loading" && (
        <div className="text-body-sm text-ink/80 leading-relaxed min-h-[4rem]">
          {summary ? renderSummary(summary) : (
            progressMessage ? (
              <div key={animationKey} className="animate-fade-in-up font-medium text-primary py-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-primary/70">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
                {progressMessage}
              </div>
            ) : (
              <div className="space-y-3 py-1">
                <div className="h-4 bg-gradient-to-r from-primary-surface to-surface-soft rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-gradient-to-r from-primary-surface to-surface-soft rounded w-full animate-pulse delay-75"></div>
                <div className="h-4 bg-gradient-to-r from-primary-surface to-surface-soft rounded w-5/6 animate-pulse delay-150"></div>
              </div>
            )
          )}
        </div>
      )}

      {status === "complete" && (
        <div className="text-body-sm text-ink leading-relaxed">
          {renderSummary(summary)}
        </div>
      )}

      {status === "error" && (
        <div className="text-body-sm text-error/80 whitespace-pre-wrap leading-relaxed">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
