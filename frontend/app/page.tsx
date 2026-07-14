import { Suspense } from "react";
import { Metadata } from "next";
import { getAllPosts } from "@/lib/markdown";
import PostList from "@/components/PostList";

export const metadata: Metadata = {
  title: "아티클 | Yehyeok's Blog",
  description: "Yehyeok의 기술 블로그 아티클 목록입니다.",
  openGraph: {
    title: "아티클 | Yehyeok's Blog",
    description: "Yehyeok의 기술 블로그 아티클 목록입니다.",
    url: "/",
    images: ["/images/og-default.png"],
  },
};

export default async function Home() {
  const posts = await getAllPosts();

  return (
    <div className="w-full">
      <div className="py-xl">
        <h1 className="text-display-lg font-extrabold text-ink tracking-tight">아티클</h1>
      </div>

      <Suspense fallback={<div className="py-xl text-center text-muted">아티클을 불러오는 중...</div>}>
        <PostList initialPosts={posts} />
      </Suspense>
    </div>
  );
}
