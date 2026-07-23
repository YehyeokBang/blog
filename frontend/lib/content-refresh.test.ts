import assert from "node:assert/strict";
import test from "node:test";
import { getContentRefreshSlugs, toPostRefreshPayload } from "./content-refresh.ts";

test("콘텐츠 새로고침 payload는 metadata와 변환된 HTML만 공개한다", () => {
  const payload = toPostRefreshPayload({
    metadata: {
      title: "테스트 글",
      date: "2026-07-23",
      slug: "test-post",
      readingTime: 3,
    },
    content: "<h1>테스트 글</h1>",
    rawContent: "# 테스트 글",
  });

  assert.deepEqual(payload, {
    metadata: {
      title: "테스트 글",
      date: "2026-07-23",
      slug: "test-post",
      readingTime: 3,
    },
    content: "<h1>테스트 글</h1>",
  });
  assert.equal("rawContent" in payload, false);
});

test("콘텐츠 새로고침 상세 경로는 공개 목록의 slug만 생성한다", () => {
  assert.deepEqual(getContentRefreshSlugs([
    { title: "첫 글", date: "2026-07-23", slug: "first-post", readingTime: 2 },
    { title: "둘째 글", date: "2026-07-22", slug: "second-post", readingTime: 3 },
  ]), ["first-post", "second-post"]);
});
