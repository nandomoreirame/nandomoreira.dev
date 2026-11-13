import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MarkdownFile {
  file: string;
  frontmatter: string;
  body: string;
  field: (name: string) => string | undefined;
}

const read = (path: string): MarkdownFile => {
  const source = readFileSync(path, 'utf8');
  const [, frontmatter = '', ...rest] = source.split(/^---$/m);
  return {
    file: path,
    frontmatter,
    body: rest.join('---'),
    field: (name) => frontmatter.match(new RegExp(`^${name}:\\s*"?([^"\\n]+)"?`, 'm'))?.[1]?.trim(),
  };
};

export const markdownIn = (dir: string): MarkdownFile[] =>
  readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => read(join(dir, file)));

/** Each English post with its pt-BR source, matched by translationOf -> slug. */
export const postPairs = (): { pt: MarkdownFile; en: MarkdownFile }[] => {
  const sources = new Map(markdownIn('src/content/posts').map((file) => [file.field('slug'), file]));
  return markdownIn('src/content/posts-en').map((en) => {
    const pt = sources.get(en.field('translationOf'));
    if (!pt) throw new Error(`${en.file}: translationOf has no source`);
    return { pt, en };
  });
};
