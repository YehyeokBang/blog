import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostData, getAllPostSlugs } from "@/lib/posts";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

// 1. Generate static routes at build time
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

// 2. Dynamic Post Detail Page (Next.js 15 compliant async params)
export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await getPostData(slug);
  } catch (error) {
    console.error("Error reading post data:", error);
    notFound();
  }

  return (
    <article className="max-w-[700px] mx-auto py-xl">
      {/* Back to List Navigation */}
      <div className="mb-lg">
        <Link
          href="/"
          className="inline-flex items-center text-[14px] font-semibold text-muted hover:text-ink transition-colors"
        >
          ← 아티클 목록
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-xxl">
        <h1 className="text-display-lg font-bold text-ink leading-tight tracking-tight mb-md">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-sm text-caption text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>읽는 시간 {Math.ceil((post.contentHtml?.length || 0) / 300) || 1}분</span>
        </div>
      </header>

      {/* Article Body */}
      <section
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
      />

      {/* Author Profile Footer */}
      <footer className="mt-section border-t border-hairline pt-xl flex items-center gap-md">
        <div className="w-[48px] h-[48px] rounded-full bg-surface-muted flex items-center justify-center font-bold text-ink text-[18px]">
          Y
        </div>
        <div>
          <h4 className="text-[15px] font-bold text-ink">방예혁</h4>
          <p className="text-[13px] text-muted">
            기록과 구현을 좋아하는 주니어 백엔드 엔지니어입니다.
          </p>
        </div>
      </footer>
    </article>
  );
}
