export type Comment = {
  id: number;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
};

export type CommentListState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | { status: "ready" };

const avatarUrl = /^https:\/\/api\.dicebear\.com\/9\.x\/fun-emoji\/svg\?seed=[A-Za-z0-9]+$/;

export function parseComments(value: unknown): Comment[] {
  if (!Array.isArray(value)) throw new Error("댓글 응답 형식이 올바르지 않습니다.");
  return value.map((item) => {
    if (!item || typeof item !== "object") throw new Error("댓글 응답 형식이 올바르지 않습니다.");
    const comment = item as Record<string, unknown>;
    if (
      !Number.isInteger(comment.id) ||
      typeof comment.authorName !== "string" ||
      typeof comment.authorAvatar !== "string" ||
      typeof comment.content !== "string" ||
      typeof comment.createdAt !== "string"
    ) {
      throw new Error("댓글 응답 형식이 올바르지 않습니다.");
    }
    return comment as Comment;
  });
}

export function resolveCommentListState(comments: Comment[] | null, error: string | null): CommentListState {
  if (error) return { status: "error", message: error };
  if (comments === null) return { status: "loading" };
  if (comments.length === 0) return { status: "empty" };
  return { status: "ready" };
}

export function safeAvatarUrl(value: string): string {
  return avatarUrl.test(value)
    ? value
    : "https://api.dicebear.com/9.x/fun-emoji/svg?seed=blogcomment";
}

export async function fetchComments(slug: string): Promise<Comment[]> {
  const response = await fetch(`/api/posts/${slug}/comments`);
  if (!response.ok) throw new Error("댓글을 불러오지 못했습니다.");
  return parseComments(await response.json());
}
