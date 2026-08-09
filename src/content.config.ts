import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'astro/loaders';
import { defineCollection } from 'astro:content';
import { assertUniqueProjectMarkdownSlugs } from './lib/content/validate';
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
 * only warns. REQ-010 needs a hard failure, so we scan the files first.
 */
const projectsLoader = () => {
  const inner = glob({ base: './src/content/projects', pattern: '**/*.md' });

  return {
    name: 'projects-unique-slug',
    load: async (context: Parameters<typeof inner.load>[0]) => {
      const projectsDir = fileURLToPath(new URL('./content/projects', import.meta.url));
      const paths = await listMarkdownFiles(projectsDir);
      const files = await Promise.all(
        paths.map(async (path) => ({
          path,
          source: await readFile(path, 'utf8'),
        })),
      );

      assertUniqueProjectMarkdownSlugs(files);
      await inner.load(context);
    },
  };
};

const projects = defineCollection({
  loader: projectsLoader(),
  schema: projectSchema,
});

const profile = defineCollection({
  loader: glob({ base: './src/content/profile', pattern: '**/*.md' }),
  schema: profileSchema,
});

export const collections = { projects, profile };
