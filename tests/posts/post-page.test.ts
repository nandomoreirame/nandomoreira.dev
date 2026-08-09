import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync('src/pages/[slug].astro', 'utf8');

describe('/[slug] post page', () => {
  it('serves both current and archived posts from the root', () => {
    const html = source();
    expect(html).toContain('getStaticPaths');
    expect(html).toContain('getAllPostEntries');
    expect(html).not.toContain('getCurrentPosts');
  });

  it('renders the body and the date', () => {
    const html = source();
    expect(html).toContain('Prose');
    expect(html).toContain('toCompactStamp');
    expect(html).toContain('<time');
  });
});
