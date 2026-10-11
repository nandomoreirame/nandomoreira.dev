import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Posts copied from the A's Code blog on 2026-10-10 and removed on 2026-10-11:
 * they live at ascode.com.br. Each old address answers a real 301 to its
 * original, so links already shared do not end in a 404.
 */
const REMOVED = [
  'amazon-bedrock-estudo-pratico-saas',
  'brag-document-importancia-2026',
  'claude-code-cursor-workflow-nextjs16',
  'como-criar-claude-project-produtivo',
  'meu-stack-ferramentas-ia-2026',
  'o-futuro-do-desenvolvimento-web',
  'por-que-usar-skills-no-claude-code',
];

const config = readFileSync('astro.config.mjs', 'utf8');

describe('posts removed in favour of ascode.com.br', () => {
  it.each(REMOVED)('%s is no longer a post here', (slug) => {
    expect(existsSync(`src/content/posts/${slug}.md`)).toBe(false);
  });

  it.each(REMOVED)('%s redirects to its original on ascode.com.br', (slug) => {
    expect(config).toContain(`'/${slug}': 'https://ascode.com.br/blog/${slug}'`);
  });

  it('leaves no image behind that only those posts used', () => {
    const leftovers = readdirSync('src/assets/posts/2026').filter((file) =>
      REMOVED.some((slug) => file.startsWith(slug)),
    );
    expect(leftovers).toEqual([]);
  });
});
