import assert from "node:assert/strict";
import test from "node:test";
import { parseComments, resolveCommentListState } from "./comments.ts";

test("댓글 응답은 배열과 각 필드를 검증한다", () => {
  const comments = parseComments([
    {
      id: 1,
      authorName: "활기찬고양이",
      authorAvatar: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=cat",
      content: "댓글입니다",
      createdAt: "2026-07-24T00:00:00Z",
    },
  ]);

  assert.equal(comments[0].id, 1);
  assert.throws(() => parseComments({}));
  assert.throws(() => parseComments([{ id: "1" }]));
});

test("댓글 목록은 network/non-2xx 오류와 빈 목록을 구분한다", () => {
  assert.deepEqual(resolveCommentListState(null, null), { status: "loading" });
  assert.deepEqual(resolveCommentListState(null, "댓글을 불러오지 못했습니다."), {
    status: "error",
    message: "댓글을 불러오지 못했습니다.",
  });
  assert.deepEqual(resolveCommentListState([], null), { status: "empty" });
  assert.deepEqual(
    resolveCommentListState(
      [
        {
          id: 1,
          authorName: "활기찬고양이",
          authorAvatar: "https://api.dicebear.com/9.x/fun-emoji/svg?seed=cat",
          content: "댓글입니다",
          createdAt: "2026-07-24T00:00:00Z",
        },
      ],
      null,
    ),
    { status: "ready" },
  );
});
