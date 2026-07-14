import { getPostBySlug, getPostMetadataBySlug, getPostSlugs } from "@/lib/markdown";
import { notFound } from "next/navigation";
import PostContent from "@/components/PostContent";
import TOC from "@/components/TOC";
import { Metadata } from "next";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const metadata = await getPostMetadataBySlug(resolvedParams.slug);
    if (!metadata) return {};

    const url = `/posts/${resolvedParams.slug}`;
    const images = metadata.thumbnail ? [metadata.thumbnail] : ["/images/og-default.png"];

    return {
      title: metadata.title,
      description: metadata.description,
      openGraph: {
        title: metadata.title,
        description: metadata.description,
        url,
        type: "article",
        publishedTime: metadata.date,
        authors: ["Yehyeok"],
        images,
      },
      twitter: {
        card: "summary_large_image",
        title: metadata.title,
        description: metadata.description,
        images,
      },
    };
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === 'ENOENT') {
      return {};
    }
    // Rethrow to fail fast during build
    throw e;
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  let post;
  try {
    post = await getPostBySlug(resolvedParams.slug);
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT') {
      notFound();
    }
    console.error("Failed to load post (Validation error):", error);
    throw error; // Fail-fast during build
  }

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.metadata.title,
    datePublished: post.metadata.date,
    author: [{
      "@type": "Person",
      name: "Yehyeok"
    }],
    description: post.metadata.description,
    image: post.metadata.thumbnail ? `${SITE_URL}${post.metadata.thumbnail}` : `${SITE_URL}/images/og-default.png`,
    url: `${SITE_URL}/posts/${resolvedParams.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
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

        <div className="block lg:hidden mb-lg p-md bg-surface-soft rounded-lg border border-hairline-soft">
          <TOC />
        </div>

        <PostContent content={post.content} />
      </article>

      <aside className="hidden lg:block w-[250px] shrink-0">
        <div className="sticky top-[100px]">
          <TOC />
        </div>
      </aside>
    </div>
    </>
  );
}
