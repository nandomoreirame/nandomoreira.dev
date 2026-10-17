import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Posts from '../../src/pages/posts/index.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Posts);
};

describe('/posts listing', () => {
  it('renders every post with PostRow, reading time included', async () => {
    const html = await render();
    expect(html).toContain('data-post-meta');
    expect(html).toMatch(/\d+ min de leitura/);
  });

  it('links the RSS feed and shows the count of published current posts next to the lead', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/rss\.xml"[^>]*>[\s\S]*?RSS[\s\S]*?<\/a>/);
    expect(html).toMatch(/data-post-count[^>]*>\s*\d+ artigos?\s*</);
  });

  it.each(['src/pages/posts/index.astro', 'src/pages/posts/arquivo/[year].astro'])('%s uses PostRow, not ListRow', (file) => {
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('<PostRow');
    expect(source).not.toContain('<ListRow');
  });
});
