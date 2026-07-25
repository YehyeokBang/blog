import { readdir, mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

  const manifest = await Promise.all(
    slugs.map(async (slug) => {
      const content = await readFile(join(postsDirectory, `${slug}.md`), "utf8");
      // Use the raw markdown content as the input for AI summary.
      // Generate SHA-256 hash to track content changes for cache invalidation.
      const contentHash = createHash("sha256").update(content).digest("hex");
      return { slug, contentHash, content };
    })
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && pathToFileURL(process.argv[1]).href === pathToFileURL(scriptPath).href) {
  const repositoryRoot = join(dirname(scriptPath), "..");
  await createPostsManifest(
    join(repositoryRoot, "content", "posts"),
    join(repositoryRoot, "backend", "src", "main", "resources", "posts.json"),
  );
}
