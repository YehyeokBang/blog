import { readdir, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function createPostsManifest(postsDirectory, outputPath) {
  const entries = await readdir(postsDirectory, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -3))
    .sort();

  if (slugs.length === 0 || slugs.some((slug) => !slugPattern.test(slug))) {
    throw new Error("posts manifest에는 하나 이상의 유효한 slug가 필요합니다.");
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(slugs)}\n`, "utf8");
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(process.argv[1]).href === pathToFileURL(scriptPath).href) {
  const repositoryRoot = join(dirname(scriptPath), "..");
  await createPostsManifest(
    join(repositoryRoot, "content", "posts"),
    join(repositoryRoot, "backend", "src", "main", "resources", "posts.json"),
  );
}
