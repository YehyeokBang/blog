import { Metadata } from "next";
import { getAllPosts } from "@/lib/markdown";
import PostList from "@/components/PostList";

export const metadata: Metadata = {
  title: "아티클",
  description: "Yehyeok의 기술 블로그 아티클 목록입니다.",
  openGraph: {
    title: "아티클",
    description: "Yehyeok의 기술 블로그 아티클 목록입니다.",
    url: "/",
  },
};

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
