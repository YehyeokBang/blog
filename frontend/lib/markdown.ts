import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';
import { Root } from 'hast';
import { calculateReadingTime } from './utils';

const postsDirectory = path.join(process.cwd(), '../content/posts');

// Frontmatter schema
const frontmatterSchema = z.object({
  title: z.string(),
  date: z.union([
    z.string().transform((str) => str.split('T')[0]),
    z.date().transform((d) => d.toISOString().split('T')[0])
  ]), // YYYY-MM-DD
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().optional(),
  draft: z.boolean().optional(),
}).strict();

export type PostMetadata = z.infer<typeof frontmatterSchema> & {
  slug: string;
  readingTime: number;
};

export type Post = {
  metadata: PostMetadata;
  content: string; // HTML string
  rawContent: string; // Raw markdown text
};

// Rehype plugin to validate images
const rehypeValidateImages: Plugin<[{ slug: string }], Root> = (options) => {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'img' && node.properties && typeof node.properties.src === 'string') {
        const src = node.properties.src;
        
        // Allow external images
        if (src.startsWith('http://') || src.startsWith('https://')) {
          return;
        }
        
        // 1. Local images must be webp
        if (!src.toLowerCase().endsWith('.webp')) {
          throw new Error(`[Fail-fast] Image "${src}" in post "${options.slug}" is not a WebP file. All local images must be WebP.`);
        }
        
        // 2. Local images must start with /images/posts/[slug]/
        const expectedPrefix = `/images/posts/${options.slug}/`;
        if (!src.startsWith(expectedPrefix)) {
          throw new Error(`[Fail-fast] Image "${src}" in post "${options.slug}" does not match the expected path prefix "${expectedPrefix}".`);
        }
      }
    });
  };
};

export async function getPostMetadataBySlug(slug: string): Promise<PostMetadata | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    const parsedData = frontmatterSchema.parse(data);

    return {
      ...parsedData,
      slug,
      readingTime: calculateReadingTime(content),
    };
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    console.error(`[Fail-fast] Error reading metadata for ${slug}:`, error);
    throw error;
  }
}

export async function getPostSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(postsDirectory);
    return files.filter((file) => file.endsWith('.md')).map((file) => file.replace(/\.md$/, ''));
  } catch (error) {
    console.error('Error reading posts directory:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = await fs.readFile(fullPath, 'utf8');

    const { data, content } = matter(fileContents);
    
    // Fail-fast validation for Frontmatter
    const parsedData = frontmatterSchema.parse(data);

    // Parse Markdown to HTML
    const processedContent = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeValidateImages, { slug }) // fail-fast image validation
      .use(rehypeSlug)
      .use(rehypePrettyCode, {
        theme: 'github-dark', // default theme, can be changed
        keepBackground: false,
      })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);

    return {
      metadata: {
        ...parsedData,
        slug,
        readingTime: calculateReadingTime(content),
      },
      content: processedContent.toString(),
      rawContent: content,
    };
  } catch (error) {
    console.error(`Error processing post ${slug}:`, error);
    throw error; // Fail-fast for build to fail
  }
}

export async function getAllPosts(): Promise<PostMetadata[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const metadata = await getPostMetadataBySlug(slug);
      return metadata;
    })
  );

  // Filter out nulls and drafts, and sort by date
  const validPosts = posts.filter((post): post is PostMetadata => post != null && post.draft !== true);
  return validPosts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}
