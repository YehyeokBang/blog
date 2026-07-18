import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPostsManifest } from "./generate-posts-manifest.mjs";

test("Markdown filename으로 정렬된 posts manifest를 만든다", async () => {
  const directory = await mkdtemp(join(tmpdir(), "posts-manifest-"));
  const postsDirectory = join(directory, "posts");
  const output = join(directory, "generated", "posts.json");
  await mkdir(postsDirectory);
  await writeFile(join(postsDirectory, "spring-jpa-osiv.md"), "# post");
  await writeFile(join(postsDirectory, "java-enum-guide.md"), "# post");
  await writeFile(join(postsDirectory, "ignored.txt"), "ignored");

  try {
    await createPostsManifest(postsDirectory, output);
    assert.equal(await (await import("node:fs/promises")).readFile(output, "utf8"), '["java-enum-guide","spring-jpa-osiv"]\n');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
