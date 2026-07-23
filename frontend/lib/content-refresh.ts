import type { Post, PostMetadata } from "./markdown";

export type PostRefreshPayload = Pick<Post, "metadata" | "content">;

export function toPostRefreshPayload(post: Post): PostRefreshPayload {
  return {
    metadata: post.metadata,
    content: post.content,
  };
}

export function getContentRefreshSlugs(posts: PostMetadata[]): string[] {
  return posts.map((post) => post.slug);
}
