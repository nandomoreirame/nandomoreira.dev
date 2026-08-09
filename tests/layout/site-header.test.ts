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
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[\s]*Fernando Moreira Costa/);
  });

  it('places the wordmark before the navigation, so it reads on the left', async () => {
    const html = await render();

    expect(html.indexOf('Fernando Moreira Costa')).toBeLessThan(html.indexOf('<nav'));
  });

  it('pushes the navigation to the opposite edge of the wordmark', async () => {
    expect(await render()).toContain('justify-between');
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

  it('forwards the notes flag and the current route to the navigation', async () => {
    const html = await render({ hasNotes: true, current: '/portfolio' });

    expect(html).toContain('href="/notas"');
    expect(html).toContain('aria-current="page"');
  });
});
