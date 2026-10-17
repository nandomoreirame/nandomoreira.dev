import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Posts from '../../src/pages/posts/index.astro';

describe('/posts list column', () => {
  it('wraps the page content in the centred list measure', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Posts);
    const main = html.slice(html.indexOf('<main'));

    expect(main).toMatch(/<div[^>]*max-w-list/);
    expect(main).toMatch(/<div[^>]*mx-auto[^>]*max-w-list|<div[^>]*max-w-list[^>]*mx-auto/);
  });
});
