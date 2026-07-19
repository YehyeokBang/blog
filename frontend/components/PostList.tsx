"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PostThumbnail from "./PostThumbnail";
import { PostMetadata } from "@/lib/markdown";
import { fetchAllEngagements } from "@/lib/engagement";

const ALL_TAG = "전체";

interface PostListProps {
  initialPosts: PostMetadata[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const searchParams = useSearchParams();
  const [engagements, setEngagements] = useState<Map<string, { likeCount: number; commentCount: number }>>(new Map());
  const [engagementError, setEngagementError] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setEngagements(await fetchAllEngagements());
        setEngagementError(false);
      } catch {
        setEngagementError(true);
      }
    };
    void load();
  }, []);
  const tagParam = searchParams?.get("tag");

  const uniqueTags = Array.from(
    new Set(initialPosts.flatMap((post) => post.tags || []))
  );
  const tags = [ALL_TAG, ...uniqueTags];
  
  const selectedTag = tagParam && uniqueTags.includes(tagParam) ? tagParam : ALL_TAG;

  const filteredPosts = selectedTag === ALL_TAG
    ? initialPosts
    : initialPosts.filter((post) => (post.tags || []).includes(selectedTag));

  return (
    <div>
      <div className="flex overflow-x-auto gap-sm mb-xxl border-b border-hairline-soft pb-lg [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={tag === ALL_TAG ? "/" : `/?tag=${encodeURIComponent(tag)}`}
            className={`whitespace-nowrap shrink-0 px-[12px] py-[6px] text-[13px] md:text-tag font-semibold rounded-full transition-colors focus:outline-none ${
              selectedTag === tag
                ? "bg-primary-surface text-primary"
                : "bg-surface-muted text-body hover:bg-hairline"
            }`}
          >
            {tag === ALL_TAG ? tag : `#${tag}`}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-[48px] md:gap-[80px] w-full">
        {filteredPosts.length === 0 ? (
          <div className="py-xl text-center text-muted">
            등록된 아티클이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.slug} className="flex flex-col-reverse sm:flex-row items-start gap-xl w-full">
              <div className="flex-1 flex flex-col items-start min-w-0 w-full">
                <div className="flex items-center gap-xs text-[13px] md:text-caption text-muted mb-md">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>읽는 시간 {post.readingTime}분</span>
                </div>

                <h2 className="text-[24px] md:text-display-md font-bold text-ink mb-md leading-[1.3] break-keep">
                  <Link 
                    href={`/posts/${post.slug}`} 
                    className="hover:underline dark:hover:text-primary underline-offset-[6px] decoration-[3px] sm:decoration-[4px] transition-all duration-75"
                    style={{ textDecorationSkipInk: "none", WebkitTextDecorationSkip: "none" }}
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="text-[15px] md:text-body-md text-body leading-relaxed mb-lg line-clamp-3">
                  {post.description}
                </p>

                {engagementError ? (
                  <p className="mb-lg text-[13px] text-muted">반응 정보를 불러오지 못했습니다.</p>
                ) : (
                  <p className="mb-lg text-[13px] md:text-caption text-muted" aria-label={`좋아요 ${engagements.get(post.slug)?.likeCount ?? 0}, 댓글 ${engagements.get(post.slug)?.commentCount ?? 0}`}>
                    ♡ {engagements.get(post.slug)?.likeCount ?? 0} 댓글 {engagements.get(post.slug)?.commentCount ?? 0}
                  </p>
                )}

                <div className="flex flex-wrap gap-xs">
                  {(post.tags || []).map((tag) => (
                    <Link
                      key={tag}
                      href={`/?tag=${encodeURIComponent(tag)}`}
                      className="px-[12px] py-[6px] text-[12px] md:text-[13px] font-semibold rounded-full bg-surface-soft text-muted hover:text-ink transition-colors focus:outline-none whitespace-nowrap"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              {post.thumbnail && (
                <Link href={`/posts/${post.slug}`} className="group shrink-0 block w-full sm:w-auto">
                  <PostThumbnail src={post.thumbnail} alt={post.title} type="list" />
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
