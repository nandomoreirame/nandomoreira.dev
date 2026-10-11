import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../../src/components/layout/SiteHeader.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteHeader, {
    props: { name: 'Fernando Moreira Costa', ...props },
  });
};

describe('SiteHeader', () => {
  it('is a banner landmark wrapping the navigation', async () => {
    const html = await render();

    expect(html).toContain('<header');
    expect(html).toContain('<nav');
  });

  it('shows the profile name as the wordmark, linked to the home page', async () => {
    const html = await render();

    expect(html).toContain('Fernando Moreira Costa');
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[\s\S]*?Fernando Moreira Costa[\s\S]*?<\/a>/);
  });

  it('paints the accent of the brand in the primary colour, keeping the text whole', async () => {
    const html = await render({ name: 'nandomoreira.dev', accent: 'moreira' });
    const link = html.match(/<a[^>]*href="\/"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toMatch(/<span class="text-primary">moreira<\/span>/);
    expect(link.replace(/<[^>]+>/g, '').replace(/\s+/g, '')).toBe('nandomoreira.dev');
  });

  it('opens the wordmark with the favicon glyph as an inline SVG, hidden from screen readers', async () => {
    const html = await render({ name: 'nandomoreira.dev', accent: 'moreira' });
    const links = html.match(/<a[^>]*href="\/"[^>]*>[\s\S]*?<\/a>/g) ?? [];

    // Desktop wordmark and the copy inside the mobile menu.
    expect(links.length).toBe(2);
    for (const link of links) {
      const svg = link.match(/<svg[^>]*>[\s\S]*?<\/svg>/)?.[0] ?? '';
      expect(svg).toMatch(/aria-hidden="true"/);
      expect(svg).toContain('viewBox="0 0 32 32"');
      // The two strokes of the favicon: the chevron and the underscore.
      expect(svg).toContain('d="M8 10l6 6-6 6"');
      expect(svg).toContain('d="M17 22h7"');
      // A primary outline lifts the tile off the header background.
      expect(svg).toMatch(/<rect[^>]*class="[^"]*stroke-primary\/50\b/);
      expect(link.indexOf('<svg')).toBeLessThan(link.indexOf('nando'));
    }
  });

  it('places the wordmark before the navigation, so it reads on the left', async () => {
    const html = await render();

    expect(html.indexOf('Fernando Moreira Costa')).toBeLessThan(html.indexOf('<nav'));
  });

  it('pushes the navigation to the opposite edge of the wordmark', async () => {
    expect(await render()).toContain('justify-between');
  });

  it('keeps wordmark and hamburger on one row on mobile, left and right', async () => {
    const html = await render();
    const row =
      html.match(/<header[\s\S]*?<div([^>]*)>[\s\S]*?href="\/"/)?.[1] ?? '';

    expect(row).toMatch(/\bflex\b/);
    expect(row).toMatch(/\bitems-center\b/);
    expect(row).toMatch(/\bjustify-between\b/);
    expect(row).not.toMatch(/\bflex-col\b/);
    expect(html).toMatch(/aria-label="Abrir menu"/);
  });

  it('caps its inner row at the layout token, keeping the border full-bleed', async () => {
    const html = await render();

    // The border sits on <header>; the container lives on the row inside it, so
    // the rule spans the viewport while the content stays on the measure.
    expect(html).toMatch(/<header[^>]*\bborder-b\b/);
    expect(html).toContain('max-w-page');
  });

  it('ships no theme toggle, per the dark-only decision', async () => {
    const html = await render();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('theme-toggle');
    expect(html).not.toContain('client:');
  });

  it('forwards the posts flag and the current route to the navigation', async () => {
    const html = await render({ hasPosts: true, current: '/portfolio' });

    expect(html).toContain('href="/posts"');
    expect(html).toContain('aria-current="page"');
  });
});
