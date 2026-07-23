"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CommentSection from "./CommentSection";
import PostContent from "./PostContent";
import PostLikeButton from "./PostLikeButton";
import PostThumbnail from "./PostThumbnail";
import TOC from "./TOC";
import { useContentRefresh } from "./ContentRefreshContext";
import type { PostRefreshPayload } from "@/lib/content-refresh";

export default function PostDetail({ initialPost }: { initialPost: PostRefreshPayload }) {
  const { registerRefreshHandler } = useContentRefresh();
  const [post, setPost] = useState(initialPost);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    return registerRefreshHandler(async () => {
      const response = await fetch(`/content-refresh/posts/${encodeURIComponent(post.metadata.slug)}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("아티클을 새로고침하지 못했습니다.");
      }

      setPost(await response.json() as PostRefreshPayload);
      setRefreshVersion((currentVersion) => currentVersion + 1);
    });
  }, [post.metadata.slug, registerRefreshHandler]);

  return (
    <div className="flex flex-col lg:flex-row gap-xl relative">
      <article key={refreshVersion} className="flex-1 max-w-[800px] w-full min-w-0">
        <div className="mb-lg">
          <Link
            href="/"
            className="inline-flex items-center text-[14px] font-semibold text-muted hover:text-ink transition-colors"
          >
            {"< 목록"}
          </Link>
        </div>

        <header id="article-header" className="mb-xl pb-lg border-b border-hairline-soft">
          <h1 className="text-display-md font-extrabold text-ink mb-md leading-tight">
            {post.metadata.title}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-y-2 gap-x-sm text-muted text-body-md">
            <div className="flex items-center gap-sm">
              <span>{post.metadata.date}</span>
              <span>·</span>
              <span>읽는 시간 {post.metadata.readingTime}분</span>
            </div>
            {post.metadata.tags && post.metadata.tags.length > 0 && (
              <>
                <span className="hidden sm:inline">·</span>
                <div className="flex flex-wrap gap-1.5 mt-1 sm:mt-0">
                  {post.metadata.tags.map((tag) => (
                    <span key={tag} className="whitespace-nowrap px-2 py-0.5 bg-surface-soft text-[13px] rounded-md font-medium text-ink/80">#{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        {post.metadata.thumbnail && (
          <PostThumbnail src={post.metadata.thumbnail} alt={post.metadata.title} type="detail" priority />
        )}

        <div className="block lg:hidden mb-lg p-md bg-surface-soft rounded-lg border border-hairline-soft">
          <TOC key={refreshVersion} variant="inline" contentVersion={refreshVersion} />
        </div>

        <PostContent content={post.content} />

        <PostLikeButton slug={post.metadata.slug} />

        <CommentSection slug={post.metadata.slug} />
      </article>

      <aside className="hidden lg:block w-[250px] shrink-0">
        <TOC key={refreshVersion} variant="sidebar" contentVersion={refreshVersion} />
      </aside>
    </div>
  );
}
