import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SLUG_PATTERN } from './schema';

export const POSTS_DIR = 'src/content/posts';
/** Its own folder: docs/reviews belongs to /rpi-review. */
export const REVIEW_DIR = 'docs/post-reviews';

/** Relative path of the post's source; null for a malformed slug or a missing file. */
export const postFileFor = (root: string, slug: string): string | null => {
  if (!SLUG_PATTERN.test(slug)) return null;
  const relative = `${POSTS_DIR}/${slug}.md`;
  return existsSync(join(root, relative)) ? relative : null;
};

export const reviewFileFor = (slug: string): string => `${REVIEW_DIR}/${slug}.md`;

/** The frontmatter title without its quotes; the slug when there is none. */
export const titleOf = (source: string, slug: string): string => {
  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(source)?.[1] ?? '';
  const raw = /^title:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim();
  return raw ? raw.replace(/^(['"])(.*)\1$/, '$2') : slug;
};
