import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Names that resolve to a static route and would shadow a post. */
const rootRoutes = () => {
  const entries = readdirSync('src/pages', { withFileTypes: true });
  return entries
    .filter(e => e.name !== '[slug].astro')
    .map(e => e.name.replace(/\.(astro|ts)$/, ''))
    .filter(n => n !== 'index');
};

describe('root slug collision', () => {
  it('no post slug is shadowed by a static root route', () => {
    const slugs = readdirSync('src/content/posts')
      .filter(f => f.endsWith('.md'))
      .map(f => readFileSync(`src/content/posts/${f}`, 'utf8').match(/^slug:\s*(\S+)$/m)?.[1]);

    // Astro resolves a static route before the dynamic [slug], so a collision
    // does not error: the post becomes unreachable in silence.
    const shadowed = slugs.filter(s => s && rootRoutes().includes(s));
    expect(shadowed, `shadowed by a page in src/pages: ${shadowed.join(', ')}`).toEqual([]);
  });
});
