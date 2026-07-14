"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PostMetadata } from "@/lib/markdown";

const ALL_TAG = "전체";

interface PostListProps {
  initialPosts: PostMetadata[];
}

export default function PostList({ initialPosts }: PostListProps) {
  const searchParams = useSearchParams();
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
            className={`whitespace-nowrap shrink-0 px-[12px] py-[6px] text-tag font-semibold rounded-full transition-colors focus:outline-none ${
              selectedTag === tag
                ? "bg-color-primary-surface text-primary"
                : "bg-surface-muted text-body hover:bg-hairline"
            }`}
          >
            {tag === ALL_TAG ? tag : `#${tag}`}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-[80px] w-full">
        {filteredPosts.length === 0 ? (
          <div className="py-xl text-center text-muted">
            등록된 아티클이 없습니다.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <article key={post.slug} className="flex flex-col-reverse sm:flex-row items-start gap-xl w-full">
              <div className="flex-1 flex flex-col items-start min-w-0 w-full">
                <div className="flex items-center gap-xs text-caption text-muted mb-md">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>읽는 시간 {post.readingTime}분</span>
                </div>

                <h2 className="text-[26px] sm:text-[30px] font-bold text-ink mb-md leading-[1.3] break-keep">
                  <Link 
                    href={`/posts/${post.slug}`} 
                    className="hover:underline dark:hover:text-primary underline-offset-[6px] decoration-[3px] sm:decoration-[4px] transition-all duration-75"
                    style={{ textDecorationSkipInk: "none", WebkitTextDecorationSkip: "none" }}
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="text-body-md sm:text-[16px] text-body leading-relaxed mb-lg line-clamp-3">
                  {post.description}
                </p>

                <div className="flex flex-wrap gap-xs">
                  {(post.tags || []).map((tag) => (
                    <Link
                      key={tag}
                      href={`/?tag=${encodeURIComponent(tag)}`}
                      className="px-[12px] py-[6px] text-[13px] font-semibold rounded-full bg-surface-soft text-muted hover:text-ink transition-colors focus:outline-none whitespace-nowrap"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>

              {post.thumbnail && (
                <Link href={`/posts/${post.slug}`} className="group shrink-0 w-full sm:w-[200px] h-[130px] overflow-hidden rounded-lg bg-surface-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.thumbnail}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
