import { getPostBySlug, getPostSlugs } from "@/lib/markdown";
import { notFound } from "next/navigation";
import PostContent from "@/components/PostContent";
import TOC from "@/components/TOC";
import { Metadata } from "next";
import Link from "next/link";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const post = await getPostBySlug(resolvedParams.slug);
    if (!post) return {};
    return {
      title: `${post.metadata.title} | Yehyeok`,
      description: post.metadata.description,
    };
  } catch (e) {
    return {};
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let post;
  try {
    post = await getPostBySlug(resolvedParams.slug);
  } catch (error) {
    console.error("Failed to load post:", error);
    notFound();
  }

  if (!post) {
    notFound();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-xl relative py-xl">
      <article className="flex-1 max-w-[800px] w-full min-w-0">
        <div className="mb-lg">
          <Link
            href="/"
            className="inline-flex items-center text-[14px] font-semibold text-muted hover:text-ink transition-colors"
          >
            ← 아티클 목록
          </Link>
        </div>

        <header className="mb-xl pb-lg border-b border-hairline-soft">
          <h1 className="text-display-md font-extrabold text-ink mb-md leading-tight">
            {post.metadata.title}
          </h1>
          <div className="flex flex-wrap items-center gap-sm text-muted text-body-md">
            <span>{post.metadata.date}</span>
            <span>·</span>
            <span>읽는 시간 {post.metadata.readingTime}분</span>
            {post.metadata.tags && post.metadata.tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex gap-xs">
                  {post.metadata.tags.map((tag) => (
                    <span key={tag}>#{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </header>

        <PostContent content={post.content} />
      </article>

      <aside className="hidden lg:block w-[250px] shrink-0">
        <div className="sticky top-[100px]">
          <TOC />
        </div>
      </aside>
    </div>
  );
}
