import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostData, getAllPostSlugs } from "@/lib/posts";
import { calculateReadingTime } from "@/lib/utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * 빌드타임 정적 HTML 생성을 위해 전체 Slug 매개변수 리스트를 제공합니다.
 */
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((item) => ({
    slug: item.slug,
  }));
}

/**
 * Next.js 15 비동기 Params 규격에 맞춰 개별 포스트의 마크다운 상세 콘텐츠를 렌더링합니다.
 */
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

      <div className="mb-lg">
        <Link
          href="/"
          className="inline-flex items-center text-[14px] font-semibold text-muted hover:text-ink transition-colors"
        >
          ← 아티클 목록
        </Link>
      </div>


      <header className="mb-xxl">
        <h1 className="text-display-lg font-bold text-ink leading-tight tracking-tight mb-md">
          {post.title}
        </h1>
        <div className="flex flex-wrap items-center gap-sm text-caption text-muted">
          <span>{post.date}</span>
          <span>·</span>
          <span>읽는 시간 {calculateReadingTime(post.contentHtml || "")}분</span>
        </div>
      </header>


      <section
        className="post-content"
        dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
      />


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
