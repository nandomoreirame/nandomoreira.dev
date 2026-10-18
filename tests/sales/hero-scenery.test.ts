import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesHero from '../../src/components/sales/SalesHero.astro';

const render = async () => (await AstroContainer.create()).renderToString(SalesHero);

/** The scenery's own markup, from its opening <svg> to the matching close. */
const scenery = (html: string) => html.match(/<svg[^>]*data-hero-scenery[\s\S]*?<\/svg>/)?.[0] ?? '';

describe('sales hero scenery', () => {
  it('draws a decorative backdrop hidden from assistive technology', async () => {
    const svg = scenery(await render());
    expect(svg).not.toBe('');
    expect(svg).toMatch(/<svg[^>]*aria-hidden="true"/);
    expect(svg).toMatch(/<svg[^>]*focusable="false"/);
    expect(svg).not.toContain('<text');
  });

  it('sits behind the browser windows, on desktop only', async () => {
    const html = await render();
    expect(html.indexOf('data-hero-scenery')).toBeLessThan(html.indexOf('data-hero-art'));
    expect(html).toMatch(
      /<div[^>]*class="[^"]*\bhidden\b[^"]*\blg:block\b[^"]*"[^>]*>\s*<div[^>]*class="[^"]*\bpointer-events-none\b[^"]*\babsolute\b[^"]*"[^>]*>\s*<svg[^>]*data-hero-scenery/,
    );
  });

  it('lets the layers drift past its own box instead of clipping them', async () => {
    expect(scenery(await render())).toMatch(/<svg[^>]*class="[^"]*\boverflow-visible\b/);
  });

  it('moves against the windows: parallax layers at distinct negative depths', async () => {
    const depths = [...scenery(await render()).matchAll(/data-parallax[^>]*--depth:\s*(-[\d.]+)/g)].map((m) => Number(m[1]));
    expect(depths.length).toBeGreaterThanOrEqual(3);
    expect(new Set(depths).size).toBe(depths.length);
    expect(depths.every((depth) => depth < 0)).toBe(true);
  });

  it('animates with the shared CSS scenery hooks, no script', async () => {
    const svg = scenery(await render());
    for (const hook of ['data-float', 'data-pulse', 'data-packet', 'data-cursor']) {
      expect(svg, hook).toContain(hook);
    }
    expect(svg).not.toContain('<script');
  });

  it('takes colours from the theme tokens only', async () => {
    const svg = scenery(await render());
    expect(svg).toContain('var(--color-primary)');
    expect(svg).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('renders the same on every request', async () => {
    expect(scenery(await render())).toBe(scenery(await render()));
  });
});
