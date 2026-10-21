import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { getAllPostEntries } from '../../src/lib/content';
import { contrastRatio } from '../../src/lib/contrast';
import PostPage from '../../src/pages/[slug].astro';

/**
 * The palette gate reads the tokens, so it never sees the syntax highlighter:
 * Shiki writes its colours inline, from its own themes. That blind spot shipped
 * once (Lighthouse: #6a737d on #24292e, 3.04:1). Since theme-modes (REQ-007) every
 * block carries both Terminal Noir themes as --shiki-dark / --shiki-light and CSS
 * picks one, so this renders the real page and measures both variants.
 */
const AA_NORMAL_TEXT = 4.5;
const VARIANTS = ['dark', 'light'] as const;
type Variant = (typeof VARIANTS)[number];

const render = async (entry: Awaited<ReturnType<typeof getAllPostEntries>>[number]) => {
  const container = await AstroContainer.create();
  return container.renderToString(PostPage, { props: { entry }, params: { slug: entry.data.slug } });
};

const tokenColours = (html: string, variant: Variant): string[] => [
  ...new Set([...html.matchAll(new RegExp(`--shiki-${variant}:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map(m => m[1]!)),
];

const blockBackground = (html: string, variant: Variant): string | undefined =>
  new RegExp(`<pre[^>]*style="[^"]*--shiki-${variant}-bg:\\s*(#[0-9a-fA-F]{6})`).exec(html)?.[1];

const withCode = async () => (await getAllPostEntries()).filter(entry => (entry.body ?? '').includes('```'));

describe('highlighted code meets AA in both themes', () => {
  it('finds published posts with fenced code, or this gate proves nothing', async () => {
    expect((await withCode()).length).toBeGreaterThan(0);
  });

  it.each(VARIANTS)('renders the %s variant as CSS variables, with no fixed inline colour', async variant => {
    const [first] = (await withCode()).filter(entry => /```[a-z]/.test(entry.body ?? ''));
    const html = await render(first!);
    expect(blockBackground(html, variant), 'no <pre> background: the selector drifted').toBeDefined();
    expect(tokenColours(html, variant).length).toBeGreaterThan(1);
    expect(html).not.toMatch(/<span style="color:#/);
  });

  it.each(VARIANTS)(
    'gives every %s token enough contrast against its block',
    async variant => {
      for (const entry of await withCode()) {
        const html = await render(entry);
        const background = blockBackground(html, variant);
        if (!background) continue;
        for (const colour of tokenColours(html, variant)) {
          expect(
            contrastRatio(colour, background),
            `${entry.data.slug} ${variant}: ${colour} on ${background}`,
          ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        }
      }
    },
    120_000,
  );

  it('points the block at the dark variant by default and at light under Paper', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(
      /\.astro-code\s*\{[^}]*color:\s*var\(--shiki-dark\)[^}]*background-color:\s*var\(--shiki-dark-bg\)/,
    );
    expect(css).toMatch(/:root\[data-theme="paper"\] \.astro-code\s*\{[^}]*var\(--shiki-light-bg\)/);
    expect(css).toMatch(/:root:not\(\[data-theme="noir"\]\) \.astro-code\s*\{[^}]*var\(--shiki-light-bg\)/);
  });

  it('proves the gate can fail', () => {
    expect(contrastRatio('#6a737d', '#24292e')).toBeLessThan(AA_NORMAL_TEXT);
  });
});
