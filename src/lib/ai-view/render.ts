import { marked } from 'marked';

/** Drop a leading YAML frontmatter fence; it is metadata, not page body. */
const stripFrontmatter = (source: string): string => {
  if (!source.startsWith('---\n') && !source.startsWith('---\r\n')) {
    return source;
  }

  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!match) return source;

  return source.slice(match[0].length);
};

/** Server-only markdown → HTML. Deterministic; never runs in the browser. */
export const renderMarkdown = (source: string): string => {
  const body = stripFrontmatter(source);
  return marked.parse(body, { async: false, gfm: true }) as string;
};
