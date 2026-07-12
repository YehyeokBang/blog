import { getAllPosts } from "@/lib/markdown";
import PostList from "@/components/PostList";

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="w-full">
      <div className="py-xl">
        <h1 className="text-display-xl font-extrabold text-ink tracking-tight">아티클</h1>
      </div>

      <PostList initialPosts={posts} />
    </div>
  );
}
