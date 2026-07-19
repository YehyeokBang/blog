export type Engagement = {
  slug: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
};

type FeedEngagement = Omit<Engagement, "liked">;

export type EngagementPage = {
  content: Map<string, Omit<FeedEngagement, "slug">>;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function parseEngagementResponse(value: unknown): Engagement {
  if (!value || typeof value !== "object") throw new Error("반응 응답 형식이 올바르지 않습니다.");
  const response = value as Record<string, unknown>;
  if (
    typeof response.slug !== "string" ||
    !isNonNegativeInteger(response.likeCount) ||
    !isNonNegativeInteger(response.commentCount) ||
    typeof response.liked !== "boolean"
  ) {
    throw new Error("반응 응답 형식이 올바르지 않습니다.");
  }
  return response as Engagement;
}

export function parseEngagementPage(value: unknown): EngagementPage {
  if (!value || typeof value !== "object") throw new Error("목록 반응 응답 형식이 올바르지 않습니다.");
  const response = value as Record<string, unknown>;
  if (!Array.isArray(response.content) || !isNonNegativeInteger(response.page) || !isNonNegativeInteger(response.size) || !isNonNegativeInteger(response.totalElements) || !isNonNegativeInteger(response.totalPages) || typeof response.last !== "boolean") {
    throw new Error("목록 반응 응답 형식이 올바르지 않습니다.");
  }
  const content = new Map<string, Omit<FeedEngagement, "slug">>();
  for (const item of response.content) {
    const engagement = parseEngagementResponse({ ...(item as object), liked: false });
    content.set(engagement.slug, { likeCount: engagement.likeCount, commentCount: engagement.commentCount });
  }
  return { content, page: response.page, size: response.size, totalElements: response.totalElements, totalPages: response.totalPages, last: response.last };
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, { credentials: "same-origin", ...init });
  if (!response.ok) throw new Error("반응 정보를 불러오지 못했습니다.");
  return response.json();
}

export async function fetchEngagementPage(page: number, size: number): Promise<EngagementPage> {
  return parseEngagementPage(await request(`/api/post-engagements?page=${page}&size=${size}`));
}

export async function fetchEngagement(slug: string): Promise<Engagement> {
  return parseEngagementResponse(await request(`/api/posts/${slug}/engagement`));
}

export async function setLikeState(slug: string, liked: boolean): Promise<Engagement> {
  const response = await request(`/api/posts/${slug}/like`, { method: liked ? "PUT" : "DELETE" });
  return parseEngagementResponse(response);
}

export function getLikeCountWidth(count: number): string {
  return `${(Math.max(1, String(count).length) * 1.01).toFixed(2)}ch`;
}
