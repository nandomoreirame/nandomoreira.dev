import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../../src/components/layout/SiteHeader.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteHeader, {
    props: { name: 'Nando Moreira', ...props },
  });
};

describe('SiteHeader stickiness', () => {
  it('pins itself to the top of the viewport while the page scrolls', async () => {
    const html = await render();

    expect(html).toMatch(/<header[^>]*\bsticky\b/);
    expect(html).toMatch(/<header[^>]*\btop-0\b/);
  });

  it('stacks above the content it scrolls over', async () => {
    expect(await render()).toMatch(/<header[^>]*\bz-\d+/);
  });

  it('carries a translucent background with a blur, not a bare transparent bar', async () => {
    const html = await render();

    // Fully transparent would let text collide with text underneath; opaque
    // would lose the effect. The pairing is what makes it readable.
    expect(html).toMatch(/<header[^>]*\bbg-background\/\d+/);
    expect(html).toMatch(/<header[^>]*\bbackdrop-blur/);
  });

  it('stays mostly transparent, so the page shows through the blur', async () => {
    const html = await render();
    const opacity = Number(html.match(/<header[^>]*\bbg-background\/(\d+)/)?.[1]);

    // Requested 2026-10-08: transparent with blur. Half opacity or less keeps
    // the content visible under the bar; the stronger blur keeps text legible.
    expect(opacity).toBeLessThanOrEqual(50);
    expect(html).toMatch(/<header[^>]*\bbackdrop-blur-(md|lg|xl)\b/);
  });

  it('stays free of client JavaScript, since stickiness is pure CSS', async () => {
    const html = await render();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('client:');
  });
});
