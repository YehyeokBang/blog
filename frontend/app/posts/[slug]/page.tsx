import { getPostBySlug, getPostMetadataBySlug, getPostSlugs } from "@/lib/markdown";
import { toPostRefreshPayload } from "@/lib/content-refresh";
import { notFound } from "next/navigation";
import PostDetail from "@/components/PostDetail";
import { Metadata } from "next";
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
      <PostDetail initialPost={toPostRefreshPayload(post)} />
    </>
  );
}
