import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { assertUniqueMarkdownSlugs } from './lib/content/validate';
import { postSchema } from './content/schemas/post';
import { profileSchema } from './content/schemas/profile';
import { projectSchema } from './content/schemas/project';

const listMarkdownFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(path);
    }
  }

  return files;
};

/**
 * Glob alone collapses two files that share data.slug into one store id and
 * only warns. A hard failure needs a pre-scan of the markdown sources.
 */
const uniqueSlugLoader = (directory: string, label: string) => {
  const base = `./src/content/${directory}`;
  const inner = glob({ base, pattern: '**/*.md' });

  return {
    name: `${directory}-unique-slug`,
    load: async (context: Parameters<typeof inner.load>[0]) => {
      const contentDir = fileURLToPath(new URL(`./content/${directory}`, import.meta.url));
      const paths = await listMarkdownFiles(contentDir);
      const files = await Promise.all(
        paths.map(async (path) => ({
          path,
          source: await readFile(path, 'utf8'),
        })),
      );

      assertUniqueMarkdownSlugs(files, label);
      await inner.load(context);
    },
  };
};

const projects = defineCollection({
  loader: uniqueSlugLoader('projects', 'project'),
  schema: projectSchema,
});

const posts = defineCollection({
  loader: uniqueSlugLoader('posts', 'post'),
  schema: postSchema,
});

const profile = defineCollection({
  loader: glob({ base: './src/content/profile', pattern: '**/*.md' }),
  schema: profileSchema,
});

export const collections = { projects, posts, profile };
