import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Posts from '../../src/pages/posts/index.astro';
import { getAllPosts } from '../../src/lib/content';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Posts);
};

describe('/posts listing', () => {
  it('renders every post with PostCard, the same card as the home, reading time included', async () => {
    const html = await render();
    expect(html).toContain('data-latest-post');
    expect(html).toContain('data-post-meta');
    expect(html).toMatch(/\d+ min de leitura/);
  });

  it('links the RSS feed and counts every published post of the blog, archive included', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/rss\.xml"[^>]*>[\s\S]*?RSS FEED[\s\S]*?<\/a>/);

    const total = (await getAllPosts()).filter(post => !post.draft).length;
    expect(html).toMatch(new RegExp(`data-post-count[^>]*>\\s*${total} artigos?\\s*<`));
  });

  it('src/pages/posts/index.astro uses PostCard, not PostRow', () => {
    const source = readFileSync('src/pages/posts/index.astro', 'utf8');
    expect(source).toContain('<PostCard');
    expect(source).not.toContain('<PostRow');
  });

  it('src/pages/posts/arquivo/[year].astro uses PostRow, not ListRow', () => {
    const source = readFileSync('src/pages/posts/arquivo/[year].astro', 'utf8');
    expect(source).toContain('<PostRow');
    expect(source).not.toContain('<ListRow');
  });
});
