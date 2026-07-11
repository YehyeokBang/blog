import { getSortedPostsData } from "@/lib/posts";
import PostList from "@/components/PostList";

export default function Home() {
  const posts = getSortedPostsData();

  return (
    <div className="w-full">
      {/* Hero Title */}
      <div className="py-xl">
        <h1 className="text-display-xl font-extrabold text-ink tracking-tight">아티클</h1>
      </div>

      {/* Dynamic Client Post List Component */}
      <PostList initialPosts={posts} />
    </div>
  );
}
