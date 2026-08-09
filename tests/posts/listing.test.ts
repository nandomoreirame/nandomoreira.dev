import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = () => readFileSync('src/pages/posts/index.astro', 'utf8');

describe('/posts listing', () => {
  it('lists current posts and links each to the root', () => {
    const html = source();
    expect(html).toContain('getCurrentPosts');
    // Detail lives at /<slug>, not under /posts/<slug>.
    expect(html).toContain('href={`/${post.slug}`}');
    expect(html).not.toContain('/posts/${post.slug}');
  });

  it('shows the date, which the old gate used to forbid', () => {
    expect(source()).toContain('toCompactStamp');
    expect(source()).toContain('stamp=');
  });

  it('offers the archive without listing archived posts inline', () => {
    const html = source();
    expect(html).toContain('href="/posts/arquivo"');
    expect(html).toContain('getCurrentPosts');
    expect(html).not.toContain('getArchivedPosts');
    expect(html).not.toContain('getAllPosts');
  });
});
