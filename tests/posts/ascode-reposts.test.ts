import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Posts copied from the A's Code blog (2026-10-10). */
const REPOSTS = [
  'amazon-bedrock-estudo-pratico-saas',
  'brag-document-importancia-2026',
  'claude-code-cursor-workflow-nextjs16',
  'como-criar-claude-project-produtivo',
  'meu-stack-ferramentas-ia-2026',
  'o-futuro-do-desenvolvimento-web',
  'por-que-usar-skills-no-claude-code',
];

describe("reposts from ascode.com.br", () => {
  it.each(REPOSTS)('%s ends by crediting its own original article', (slug) => {
    const post = readFileSync(`src/content/posts/${slug}.md`, 'utf8').trimEnd();
    const lastLine = post.split('\n').at(-1) ?? '';
    expect(lastLine).toContain(`(https://ascode.com.br/blog/${slug})`);
    expect(lastLine).toMatch(/publicado originalmente no blog da A's Code/);
  });

  it.each(REPOSTS)('%s carries no leftover MDX', (slug) => {
    const body = readFileSync(`src/content/posts/${slug}.md`, 'utf8').replace(/```[\s\S]*?```/g, '');
    expect(body).not.toMatch(/^import |^export const |<Image\b/m);
  });
});

const ORIGINALS = '../ascode.com.br/src/app/blog';
const codeBlocks = (text: string) => text.match(/```[\s\S]*?```/g) ?? [];

describe('reposts keep every code block intact', () => {
  // The first conversion stripped `import ...` lines everywhere, including
  // inside code examples (2026-10-10). Compared against the source when the
  // sibling repository is checked out; skipped on a clean clone.
  it.skipIf(!existsSync(ORIGINALS)).each(REPOSTS)('%s', (slug) => {
    const original = readFileSync(`${ORIGINALS}/${slug}/page.mdx`, 'utf8');
    const copy = readFileSync(`src/content/posts/${slug}.md`, 'utf8');
    expect(codeBlocks(copy)).toEqual(codeBlocks(original));
  });
});
