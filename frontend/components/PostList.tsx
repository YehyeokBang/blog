"use client";

import { useState } from "react";
import Link from "next/link";
import { PostData } from "@/lib/posts";

interface PostListProps {
  initialPosts: PostData[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const [selectedTag, setSelectedTag] = useState("전체");

  const uniqueTags = Array.from(
    new Set(initialPosts.flatMap((post) => post.tags))
  );
  const tags = ["전체", ...uniqueTags];

  const filteredPosts = selectedTag === "전체"
    ? initialPosts
    : initialPosts.filter((post) => post.tags.includes(selectedTag));

  return (
    <div>
      <div className="flex flex-wrap gap-sm mb-xxl border-b border-hairline-soft pb-lg">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`px-[12px] py-[6px] text-tag font-semibold rounded-full cursor-pointer transition-colors border-0 focus:outline-none ${
              selectedTag === tag
                ? "bg-color-primary-surface text-primary"
                : "bg-surface-muted text-body hover:bg-hairline"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-xxl max-w-[700px]">
        {filteredPosts.length === 0 ? (
          <div className="py-xl text-center text-muted">
            등록된 아티클이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.slug} className="group flex flex-col items-start">
              <div className="flex items-center gap-xs text-caption text-muted mb-sm">
                <span>{post.date}</span>
                <span>·</span>
                <span>읽는 시간 {Math.ceil(post.description.length / 100) || 1}분</span>
              </div>

              <h2 className="text-title-lg font-bold text-ink group-hover:text-primary transition-colors mb-sm leading-snug">
                <Link href={`/posts/${post.slug}`}>
                  {post.title}
                </Link>
              </h2>

              <p className="text-body-md text-body leading-relaxed mb-md">
                {post.description}
              </p>

              <div className="flex flex-wrap gap-xs">
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className="px-[10px] py-[4px] text-[12px] font-semibold rounded-full bg-surface-soft text-muted hover:text-ink transition-colors border-0 focus:outline-none cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
