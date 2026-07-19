import assert from "node:assert/strict";
import test from "node:test";
import {
  getLikeCountWidth,
  parseEngagementPage,
  parseEngagementResponse,
  resolveFeedEngagementState,
} from "./engagement.ts";

test("engagement 응답을 서버 정본 타입으로 파싱한다", () => {
  assert.deepEqual(
    parseEngagementResponse({ slug: "test-post", likeCount: 1, commentCount: 2, liked: true }),
    { slug: "test-post", likeCount: 1, commentCount: 2, liked: true },
  );
  assert.throws(() => parseEngagementResponse({ slug: "test-post", likeCount: -1 }));
});

test("목록 projection은 slug별 count map으로 변환한다", () => {
  const page = parseEngagementPage({
    content: [{ slug: "test-post", likeCount: 3, commentCount: 4 }],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    last: true,
  });

  assert.deepEqual(page.content.get("test-post"), { likeCount: 3, commentCount: 4 });
});

test("좋아요 숫자 폭은 같은 자릿수 구간에서 유지된다", () => {
  assert.equal(getLikeCountWidth(0), "1.01ch");
  assert.equal(getLikeCountWidth(9), "1.01ch");
  assert.equal(getLikeCountWidth(10), "2.02ch");
  assert.equal(getLikeCountWidth(99), "2.02ch");
  assert.equal(getLikeCountWidth(100), "3.03ch");
});

test("피드 반응 상태는 미확인 count와 실제 0을 구분한다", () => {
  assert.deepEqual(resolveFeedEngagementState(null, "test-post", false), { status: "loading" });
  assert.deepEqual(
    resolveFeedEngagementState(
      new Map([["test-post", { likeCount: 0, commentCount: 0 }]]),
      "test-post",
      false,
    ),
    { status: "ready", likeCount: 0, commentCount: 0 },
  );
});

test("피드 반응 상태는 실패와 누락 응답을 오류로 구분한다", () => {
  assert.deepEqual(resolveFeedEngagementState(null, "test-post", true), { status: "error" });
  assert.deepEqual(resolveFeedEngagementState(new Map(), "test-post", false), { status: "error" });
});
