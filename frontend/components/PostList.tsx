"use client";

import { useState } from "react";
import Link from "next/link";
import { PostMetadata } from "@/lib/markdown";

const ALL_TAG = "전체";

interface PostListProps {
  initialPosts: PostMetadata[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [selectedTag, setSelectedTag] = useState(ALL_TAG);

  const uniqueTags = Array.from(
    new Set(initialPosts.flatMap((post) => post.tags || []))
  );
  const tags = [ALL_TAG, ...uniqueTags];

  const filteredPosts = selectedTag === ALL_TAG
    ? initialPosts
    : initialPosts.filter((post) => (post.tags || []).includes(selectedTag));

  return (
    <div>
      <div className="flex overflow-x-auto gap-sm mb-xxl border-b border-hairline-soft pb-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`whitespace-nowrap shrink-0 px-[12px] py-[6px] text-tag font-semibold rounded-full cursor-pointer transition-colors border-0 focus:outline-none ${
              selectedTag === tag
                ? "bg-color-primary-surface text-primary"
                : "bg-surface-muted text-body hover:bg-hairline"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-xxl w-full">
        {filteredPosts.length === 0 ? (
          <div className="py-xl text-center text-muted">
            등록된 아티클이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.slug} className="group relative flex items-start gap-lg w-full">
              <div className="flex-1 flex flex-col items-start min-w-0">
                <div className="flex items-center gap-xs text-caption text-muted mb-sm">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>읽는 시간 {post.readingTime}분</span>
                </div>

                <h2 className="text-title-lg font-bold text-ink group-hover:text-primary transition-colors mb-sm leading-snug">
                  <Link href={`/posts/${post.slug}`} className="after:absolute after:inset-0">
                    {post.title}
                  </Link>
                </h2>

                <p className="text-body-md text-body leading-relaxed mb-md">
                  {post.description}
                </p>

                <div className="flex flex-wrap gap-xs">
                  {(post.tags || []).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(tag)}
                      className="relative z-10 px-[10px] py-[4px] text-[12px] font-semibold rounded-full bg-surface-soft text-muted hover:text-ink transition-colors border-0 focus:outline-none cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {post.thumbnail && (
                <div className="hidden sm:block shrink-0 w-[140px] h-[90px] overflow-hidden rounded-md bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnail}
                    alt={`${post.title} 썸네일`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
