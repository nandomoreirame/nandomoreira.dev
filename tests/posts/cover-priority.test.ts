import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import PostPage from '../../src/pages/[slug].astro';

/**
 * The cover sits above the fold and is the Largest Contentful Paint element on
 * every post that has one. Astro defaults an <Image> to `loading="lazy"`, which
 * tells the browser to defer precisely the thing the page is waiting on.
 *
 * Lighthouse measured 13.2s LCP on a published post because of this.
 */
const render = async (entry: Awaited<ReturnType<typeof getAllPostEntries>>[number]) => {
  const container = await AstroContainer.create();

  return container.renderToString(PostPage, {
    props: { entry },
    params: { slug: entry.data.slug },
  });
};

const withCover = async () => (await getAllPostEntries()).filter(entry => entry.data.cover);

const coverTag = (html: string): string | undefined => /<img[^>]*>/.exec(html)?.[0];

describe('the post cover is loaded as the LCP element', () => {
  it('finds published posts with a cover, or this gate proves nothing', async () => {
    expect((await withCover()).length).toBeGreaterThan(0);
  });

  it('never defers the cover, since it is what the page is waiting on', async () => {
    for (const entry of await withCover()) {
      const tag = coverTag(await render(entry));

      expect(tag, entry.data.slug).toBeDefined();
      expect(tag, entry.data.slug).not.toContain('loading="lazy"');
    }
  }, 120_000);

  it('asks the browser to prioritise it', async () => {
    const [first] = await withCover();
    const tag = coverTag(await render(first));

    expect(tag).toContain('fetchpriority="high"');
  });

  it('still declares responsive sources, so priority does not mean full size', async () => {
    const [first] = await withCover();
    const tag = coverTag(await render(first));

    expect(tag).toContain('srcset');
    expect(tag).toContain('sizes');
  });
});
