import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import PostPage from '../../src/pages/[slug].astro';

describe('post page slug for the reviewer', () => {
  it('marks the article with the post slug', async () => {
    const [entry] = await getAllPostEntries();
    expect(entry).toBeTruthy();
    const html = await (
      await AstroContainer.create()
    ).renderToString(PostPage, {
      props: { entry },
      params: { slug: entry!.data.slug },
    });
    expect(html).toMatch(new RegExp(`<article[^>]*data-post-slug="${entry!.data.slug}"`));
  });
});
