import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync('src/pages/posts/arquivo/[year].astro', 'utf8');

describe('/posts/arquivo/[year]', () => {
  it('generates one route per year that has posts, and none for empty years', () => {
    const html = source();
    expect(html).toContain('getStaticPaths');
    expect(html).toContain('getArchiveYears');
    expect(html).toContain('getArchivedPostsByYear');
    expect(html).toContain('prerender');
  });

  it('lists posts for the year linking to the root slug', () => {
    const html = source();
    expect(html).toContain('href={`/${post.slug}`}');
    expect(html).toContain('toCompactStamp');
  });
});
