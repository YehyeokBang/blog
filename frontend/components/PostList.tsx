"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PostThumbnail from "./PostThumbnail";
import { PostMetadata } from "@/lib/markdown";
import { fetchAllEngagements, resolveFeedEngagementState } from "@/lib/engagement";
import { hasHorizontalOverflow } from "@/lib/feed-ui";
import { useContentRefresh } from "./ContentRefreshContext";

const ALL_TAG = "전체";

interface PostListProps {
  initialPosts: PostMetadata[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const searchParams = useSearchParams();
  const { registerRefreshHandler } = useContentRefresh();
  const [posts, setPosts] = useState(initialPosts);
  const [engagements, setEngagements] = useState<Map<string, { likeCount: number; commentCount: number }> | null>(null);
  const [engagementError, setEngagementError] = useState(false);
  const tagListRef = useRef<HTMLDivElement>(null);
  const [hasTagOverflow, setHasTagOverflow] = useState(false);

  const updateTagOverflow = useCallback(() => {
    const tagList = tagListRef.current;
    if (tagList) {
      setHasTagOverflow(hasHorizontalOverflow(tagList));
    }
  }, []);

  const loadEngagements = useCallback(async () => {
    try {
      setEngagements(await fetchAllEngagements());
      setEngagementError(false);
    } catch {
      setEngagementError(true);
    }
  }, []);

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

  useEffect(() => {
    return registerRefreshHandler(async () => {
      const response = await fetch("/content-refresh/post-index", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("아티클 목록을 새로고침하지 못했습니다.");
      }

      setPosts(await response.json() as PostMetadata[]);
      setEngagements(null);
      setEngagementError(false);
      void loadEngagements();
    });
  }, [loadEngagements, registerRefreshHandler]);
  const tagParam = searchParams?.get("tag");

  const uniqueTags = Array.from(
    new Set(posts.flatMap((post) => post.tags || []))
  );
  const tags = [ALL_TAG, ...uniqueTags];
  const tagListKey = tags.join("\u0000");
  
  const selectedTag = tagParam && uniqueTags.includes(tagParam) ? tagParam : ALL_TAG;

  const filteredPosts = selectedTag === ALL_TAG
    ? posts
    : posts.filter((post) => (post.tags || []).includes(selectedTag));

  useEffect(() => {
    const tagList = tagListRef.current;
    if (!tagList) {
      return;
    }

    const resizeObserver = new ResizeObserver(updateTagOverflow);
    resizeObserver.observe(tagList);
    tagList.addEventListener("scroll", updateTagOverflow, { passive: true });
    updateTagOverflow();

    return () => {
      resizeObserver.disconnect();
      tagList.removeEventListener("scroll", updateTagOverflow);
    };
  }, [tagListKey, updateTagOverflow]);

  return (
    <div>
      <div className="relative mb-xxl border-b border-hairline-soft pb-lg">
        <div
          ref={tagListRef}
          className="flex overflow-x-auto gap-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {tags.map((tag) => (
            <Link
              key={tag}
              href={tag === ALL_TAG ? "/" : `/?tag=${encodeURIComponent(tag)}`}
              className={`whitespace-nowrap shrink-0 rounded-full px-[12px] py-[6px] text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary md:text-tag ${
                selectedTag === tag
                  ? "bg-primary-surface text-primary"
                  : "bg-surface-muted text-body hover:bg-hairline"
              }`}
            >
              {tag === ALL_TAG ? tag : `#${tag}`}
            </Link>
          ))}
        </div>
        {hasTagOverflow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-canvas to-transparent"
          />
        )}
      </div>

      <div className="flex flex-col gap-[48px] md:gap-[80px] w-full">
        {filteredPosts.length === 0 ? (
          <div className="py-xl text-center text-muted">
            등록된 아티클이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => {
            const engagementState = resolveFeedEngagementState(engagements, post.slug, engagementError);

            return (
              <article key={post.slug} className="group/card relative isolate w-full">
                <Link
                  href={`/posts/${post.slug}`}
                  aria-label={post.title}
                  data-pull-refresh-allow
                  className="post-card-link absolute inset-0 z-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-canvas"
                />
                <div className="pointer-events-none relative z-10 flex w-full flex-col-reverse items-start gap-xl sm:flex-row">
                  <div className="flex w-full min-w-0 flex-1 flex-col items-start">
                    <div className="mb-md flex items-center gap-xs text-[13px] text-muted md:text-caption">
                      <span>{post.date}</span>
                      <span>·</span>
                      <span>읽는 시간 {post.readingTime}분</span>
                    </div>

                    <h2 className="mb-md break-keep text-[24px] font-bold leading-[1.3] text-ink transition-all duration-75 group-has-[.post-card-link:hover]/card:underline dark:group-has-[.post-card-link:hover]/card:text-primary md:text-display-md">
                      {post.title}
                    </h2>

                    <p className="mb-lg line-clamp-3 text-[15px] leading-relaxed text-body md:text-body-md">
                      {post.description}
                    </p>

                    {engagementState.status === "loading" ? (
                      <p
                        className="mb-lg flex h-5 w-[6.5rem] items-center text-[13px] leading-5 text-muted md:text-caption"
                        aria-busy="true"
                      >
                        <span className="sr-only">반응 정보 불러오는 중</span>
                        <span aria-hidden="true" className="loading-shimmer block h-5 w-full rounded-md" />
                      </p>
                    ) : engagementState.status === "error" ? (
                      <p className="mb-lg flex h-5 items-center text-[13px] leading-5 text-muted">
                        반응 정보를 불러오지 못했습니다.
                      </p>
                    ) : (
                      <p
                        className="mb-lg flex h-5 w-[6.5rem] items-center whitespace-nowrap text-[13px] leading-5 text-muted md:text-caption"
                        aria-label={`좋아요 ${engagementState.likeCount}, 댓글 ${engagementState.commentCount}`}
                      >
                        ♡ {engagementState.likeCount} 댓글 {engagementState.commentCount}
                      </p>
                    )}

                    <div className="pointer-events-none relative z-20 flex flex-wrap gap-xs">
                      {(post.tags || []).map((tag) => (
                        <Link
                          key={tag}
                          href={`/?tag=${encodeURIComponent(tag)}`}
                          className="pointer-events-auto whitespace-nowrap rounded-full bg-surface-soft px-[12px] py-[6px] text-[12px] font-semibold text-muted transition-colors hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas md:text-[13px]"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>

                  {post.thumbnail && (
                    <div className="w-full shrink-0 sm:w-auto">
                      <PostThumbnail src={post.thumbnail} alt={post.title} type="list" />
                    </div>
                  )}
                </div>

              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
