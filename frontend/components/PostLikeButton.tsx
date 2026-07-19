"use client";

import { useEffect, useState } from "react";
import { Engagement, fetchEngagement, getLikeCountWidth, setLikeState } from "@/lib/engagement";

export default function PostLikeButton({ slug }: { slug: string }) {
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchEngagement(slug)
      .then((nextEngagement) => {
        if (active) { setEngagement(nextEngagement); setError(null); }
      })
      .catch(() => {
        if (active) setError("반응 정보를 불러오지 못했습니다.");
      });
    return () => { active = false; };
  }, [slug]);

  const toggle = async () => {
    if (!engagement) return;
    setIsSubmitting(true); setError(null);
    try { setEngagement(await setLikeState(slug, !engagement.liked)); } catch { setError("좋아요 처리에 실패했습니다. 다시 시도해주세요."); } finally { setIsSubmitting(false); }
  };
  if (!engagement) return <p className="mt-xl text-caption text-muted">{error ?? "반응 정보를 불러오는 중..."}</p>;
  return <div className="mt-xl"><button type="button" onClick={toggle} disabled={isSubmitting} aria-pressed={engagement.liked} className={`min-h-xxl rounded-lg border px-lg text-body-md font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${engagement.liked ? "border-primary bg-primary-surface text-primary" : "border-hairline bg-canvas text-body hover:border-primary hover:text-primary"}`}><span aria-hidden="true" className="inline-block w-[1em] text-center">{engagement.liked ? "♥" : "♡"}</span>{" "}이 글이 도움됐어요{" "}<span className="inline-block text-right tabular-nums" style={{ width: getLikeCountWidth(engagement.likeCount) }}>{engagement.likeCount}</span></button>{error && <p className="mt-sm text-caption text-red-500">{error}</p>}</div>;
}
