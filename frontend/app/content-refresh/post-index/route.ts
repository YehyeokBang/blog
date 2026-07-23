import { getAllPosts } from "@/lib/markdown";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(await getAllPosts());
}
