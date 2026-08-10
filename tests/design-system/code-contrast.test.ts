import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import { contrastRatio } from '../../src/lib/contrast';
import PostPage from '../../src/pages/[slug].astro';

/**
 * The design-system contrast gate reads the palette tokens, so it never sees the
 * syntax highlighter: Shiki writes its colours INLINE, from its own theme.
 *
 * That blind spot shipped. Lighthouse found `#6a737d` on `#24292e` at 3.04:1 in
 * a published post, comfortably below AA, on a site whose own gate is supposed
 * to make that impossible. This renders the real page, so it measures what a
 * reader actually gets rather than what a parallel processor would produce.
 */
const AA_NORMAL_TEXT = 4.5;

const render = async (entry: Awaited<ReturnType<typeof getAllPostEntries>>[number]) => {
  const container = await AstroContainer.create();

  return container.renderToString(PostPage, {
    props: { entry },
    params: { slug: entry.data.slug },
  });
};

const inlineColours = (html: string): string[] => [
  ...new Set([...html.matchAll(/style="[^"]*color:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1])),
];

const blockBackground = (html: string): string | undefined =>
  /<pre[^>]*style="[^"]*background-color:\s*(#[0-9a-fA-F]{6})/.exec(html)?.[1];

const withCode = async () => {
  const entries = await getAllPostEntries();

  return entries.filter((entry) => (entry.body ?? '').includes('```'));
};

describe('highlighted code meets AA', () => {
  it('finds published posts with fenced code, or this gate proves nothing', async () => {
    expect((await withCode()).length).toBeGreaterThan(0);
  });

  it('renders code with an inline theme, which is the blind spot being covered', async () => {
    const [first] = await withCode();
    const html = await render(first);

    expect(blockBackground(html), 'no <pre> background: the selector drifted').toBeDefined();
    expect(inlineColours(html).length).toBeGreaterThan(1);
  });

  it('gives every token enough contrast against its block background', async () => {
    for (const entry of await withCode()) {
      const html = await render(entry);
      const background = blockBackground(html);

      if (!background) continue;

      for (const colour of inlineColours(html)) {
        expect(
          contrastRatio(colour, background),
          `${entry.data.slug}: ${colour} on ${background}`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  }, 120_000);

  it('proves the gate can fail', () => {
    // The exact pair Lighthouse reported, so the gate is anchored to a real defect.
    expect(contrastRatio('#6a737d', '#24292e')).toBeLessThan(AA_NORMAL_TEXT);
  });
});
