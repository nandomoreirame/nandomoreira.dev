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

  // Terminal Noir (2026-10-16): the hairline is always on, as in the Stitch
  // file; only the fill and the blur wait for the scroll.
  it('keeps the hairline at the top of the page, with no background and no blur yet', async () => {
    const header = (await render()).match(/<header[^>]*>/)?.[0] ?? '';
    const classes = header.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];

    expect(header).toContain('data-site-header');
    expect(classes).toContain('border-border');
    for (const unconditional of classes.filter(name => !name.includes(':'))) {
      expect(unconditional).not.toMatch(/^(bg-background|backdrop-blur)/);
    }
  });

  it('gains the translucent background and the blur once scrolled', async () => {
    const header = (await render()).match(/<header[^>]*>/)?.[0] ?? '';

    expect(header).toMatch(/\bdata-scrolled:bg-background\/(\d+)\b/);
    expect(Number(header.match(/data-scrolled:bg-background\/(\d+)/)?.[1])).toBeLessThanOrEqual(50);
    expect(header).toMatch(/\bdata-scrolled:backdrop-blur-(md|lg|xl)\b/);
    expect(header).toMatch(/\btransition-\[[^\]]*background-color/);
  });

  it('stays free of client JavaScript, since stickiness is pure CSS', async () => {
    const html = await render();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('client:');
  });
});

describe('header fill without JavaScript', () => {
  it('keeps the filled header when scripting is off, so text never collides', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/styles/global.css', 'utf8');
    const block = css.match(/@media \(scripting: none\)\s*\{([\s\S]*?)\n\s*\}\s*\n/)?.[1] ?? '';

    expect(block).toContain('[data-site-header]');
    expect(block).toMatch(/backdrop-filter/);
  });
});

describe('scroll state in the single site script', () => {
  it('toggles data-scrolled on the header from the scroll position, passively', async () => {
    const { readFileSync } = await import('node:fs');
    const script = readFileSync('src/components/art/PointerField.astro', 'utf8');

    expect(script).toContain("querySelector('[data-site-header]')");
    expect(script).toContain("toggleAttribute('data-scrolled'");
    expect(script).toMatch(/passive:\s*true/);
  });

  it('never reads the scroll position at load, only in response to scroll', async () => {
    // Reading scrollY at load forced a synchronous layout in Lighthouse
    // (forced-reflow insight: 84 ms inline, 45 ms deferred one frame,
    // 2026-10-09). Anchors and restored positions fire scroll anyway.
    const { readFileSync } = await import('node:fs');
    const script = readFileSync('src/components/art/PointerField.astro', 'utf8');
    expect(script).not.toMatch(/requestAnimationFrame\(sync\)|^\s*sync\(\);/m);
    expect(script).toContain("addEventListener('scroll', sync, { passive: true })");
  });
});
