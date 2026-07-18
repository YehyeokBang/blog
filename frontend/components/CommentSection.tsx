"use client";

import { useState, useEffect, FormEvent } from "react";

interface Comment {
  id: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

const ADJECTIVES = ["활기찬", "명랑한", "재미있는", "용감한", "지혜로운", "신비로운", "즐거운", "행복한"];
const NOUNS = ["다람쥐", "펭귄", "사슴", "나비", "고양이", "강아지", "여우", "부엉이"];

function formatTimeAgo(dateInput: string | number) {
  if (!dateInput) return "";
  
  // Spring Boot에서 Float 타임스탬프로 주는 경우 방어 로직
  let timestamp = typeof dateInput === "number" ? dateInput : Number(dateInput);
  if (isNaN(timestamp)) {
    timestamp = new Date(dateInput).getTime();
  } else if (timestamp < 10000000000) {
    // 초 단위인 경우 밀리초로 변환 (예: 1784308431.488000000)
    timestamp = timestamp * 1000;
  }

  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomProfile() {
  const seed = Math.random().toString(36).substring(7);
  const name = `${getRandomItem(ADJECTIVES)}${getRandomItem(NOUNS)}`;
  return {
    name,
    avatar: `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}`,
  };
}

export default function CommentSection({ slug }: { slug: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState({ name: "", avatar: "" });
  const [content, setContent] = useState("");
  const [contentError, setContentError] = useState(false);

  useEffect(() => {
    // Generate profile on mount to avoid hydration mismatch
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(generateRandomProfile());
  }, []);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await fetch(`/api/posts/${slug}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setContentError(true);
      return;
    }
    setContentError(false);
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorName: profile.name,
          authorAvatar: profile.avatar,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("댓글 등록에 실패했습니다.");
      }

      const newComment = await res.json();
      setComments((prev) => [...prev, newComment]);
      setContent("");

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRandomize = () => {
    setProfile(generateRandomProfile());
  };

  return (
    <div className="mt-24">
      <h2 className="text-title-md font-bold text-ink mb-6">
        댓글 {comments.length}
      </h2>

      <form onSubmit={handleSubmit} className="mb-12">
        <div className="flex gap-4 mb-4">
          {/* Avatar */}
          <div className="shrink-0 mt-1">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar}
                alt={profile.name}
                width={52}
                height={52}
                className="rounded-full bg-surface-muted"
              />
            ) : (
              <div className="w-[52px] h-[52px] rounded-full bg-surface-muted animate-pulse" />
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            {/* Nickname & Randomize */}
            <div className="flex items-center justify-between px-4 py-3 border border-hairline rounded-xl bg-canvas">
              <span className="text-body-md font-medium text-ink">{profile.name}</span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-tag px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-hairline text-body font-medium transition-colors cursor-pointer"
              >
                랜덤 변경
              </button>
            </div>

            {/* Content Input */}
            <div className={`border rounded-xl bg-canvas overflow-hidden transition-colors focus-within:border-primary ${contentError ? 'border-red-500' : 'border-hairline'}`}>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (contentError) setContentError(false);
                }}
                maxLength={1000}
                placeholder="입력한 댓글은 수정하거나 삭제할 수 없어요. 또한 허위사실, 욕설, 사칭 등 댓글은 통보없이 삭제될 수 있습니다."
                className="w-full h-[120px] p-4 bg-transparent resize-none focus:outline-none text-body-md text-ink placeholder-muted"
              />
            </div>

            {contentError && (
              <p className="text-red-500 text-sm mt-1">댓글 내용을 입력해주세요.</p>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-on-primary rounded-xl font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "등록 중..." : "댓글 남기기"}
          </button>
        </div>
      </form>

      {/* Comment List */}
      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-surface-soft p-5 rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={comment.authorAvatar}
                alt={comment.authorName}
                width={36}
                height={36}
                className="rounded-full bg-surface-muted"
              />
              <div className="flex flex-col">
                <span className="text-body-md font-bold text-ink">
                  {comment.authorName}
                </span>
                <span className="text-body-sm text-muted">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>
            </div>
            <p className="text-body-md text-body whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          </div>
        ))}
        {comments.length === 0 && !isLoading && (
          <div className="text-center py-12 text-muted text-body-md bg-surface-soft rounded-2xl">
            가장 먼저 댓글을 남겨보세요.
          </div>
        )}
      </div>
    </div>
  );
}
