import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypePrettyCode from "rehype-pretty-code";

const postsDirectory = path.join(process.cwd(), "../content/posts");

export interface PostData {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  contentHtml?: string;
}

/**
 * content/posts 디렉터리 내 마크다운 파일들의 메타데이터(Frontmatter)를 파싱하고
 * 발행일을 기준으로 내림차순 정렬된 목록을 반환합니다.
 */
export function getSortedPostsData(): PostData[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const matterResult = matter(fileContents);
      const tags = Array.isArray(matterResult.data.tags)
        ? matterResult.data.tags
        : [];

      return {
        slug,
        title: matterResult.data.title || slug,
        date: matterResult.data.date || "",
        description: matterResult.data.description || "",
        tags,
      };
    });

  return allPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else if (a.date > b.date) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * SSG(Static Site Generation) 빌드 시 동적 세그먼트 생성에 필요한
 * 모든 마크다운 파일명의 Slug 목록을 반환합니다.
 */
export function getAllPostSlugs() {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      return {
        slug: fileName.replace(/\.md$/, ""),
      };
    });
}

/**
 * 개별 Slug에 해당하는 마크다운 파일을 읽어 Frontmatter 분리 및
 * Shiki 테마가 적용된 HTML 구조로 컴파일하여 반환합니다.
 */
export async function getPostData(slug: string): Promise<PostData> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const matterResult = matter(fileContents);

  const processedContent = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypePrettyCode, {
      theme: "github-dark",
      keepBackground: true,
    })
    .use(rehypeStringify)
    .process(matterResult.content);

  const contentHtml = processedContent.toString();
  const tags = Array.isArray(matterResult.data.tags)
    ? matterResult.data.tags
    : [];

  return {
    slug,
    title: matterResult.data.title || slug,
    date: matterResult.data.date || "",
    description: matterResult.data.description || "",
    tags,
    contentHtml,
  };
}
