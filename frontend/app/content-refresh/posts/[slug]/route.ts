import { toPostRefreshPayload } from "@/lib/content-refresh";
import { getAllPosts, getPostBySlug } from "@/lib/markdown";
import { getContentRefreshSlugs } from "@/lib/content-refresh";

export const dynamic = "force-static";
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = getContentRefreshSlugs(await getAllPosts());
  return slugs.map((slug) => ({ slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return new Response(null, { status: 404 });
  }

  return Response.json(toPostRefreshPayload(post));
}
