import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav, { props });
};

describe('SiteNav', () => {
  it('carries the main sections that already exist as routes or anchors', async () => {
    const html = await render();

    for (const label of ['Portfólio', 'Lab', 'Sobre', 'Contato']) {
      expect(html).toContain(label);
    }

    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/lab"');
    expect(html).toContain('href="/sobre"');
    expect(html).toContain('href="/contato"');
  });

  it('shortens the lab label so five items fit the 768px measure', async () => {
    const html = await render();

    expect(html).not.toContain('Laboratório');
    // Uppercase is applied in CSS, so the accessible name stays "Lab" and does
    // not read as an acronym to a screen reader.
    expect(html).toContain('>Lab<');
  });

  it('shows Blog only when at least one post is published', async () => {
    const withPosts = await render({ hasPosts: true });
    expect(withPosts).toContain('>Blog<');
    expect(withPosts).not.toContain('>Posts<');
    expect(withPosts).toContain('href="/posts"');

    // Blog leads the menu, ahead of Portfólio.
    expect(withPosts.indexOf('href="/posts"')).toBeLessThan(withPosts.indexOf('href="/portfolio"'));

    const without = await render({ hasPosts: false });
    expect(without).not.toContain('href="/posts"');
    expect(without).not.toContain('>Blog<');
  });

  it('marks the current page for assistive technology', async () => {
    expect(await render({ current: '/portfolio' })).toContain('aria-current="page"');
  });

  it('is a navigation landmark with an accessible name', async () => {
    const html = await render();

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label=');
  });

  it('works without JavaScript, so no island and no toggle state', async () => {
    expect(await render()).not.toContain('client:');
  });

  it('never points at a route that does not exist', async () => {
    const html = await render();

    expect(html).not.toContain('href="/projetos"');
    expect(html).not.toContain('href="/agents"');
    // `/contato` used to be listed here as a non-existent route. It is a real
    // page now, so the anchor it replaced is what must not come back.
    expect(html).not.toContain('href="/#contato"');
  });
});

describe('SiteNav MCP entry', () => {
  it('links the MCP page, right before Contato', async () => {
    const html = await render({ hasPosts: true });
    expect(html).toMatch(/<a[^>]*href="\/mcp"[^>]*>[\s\S]*?MCP[\s\S]*?<\/a>/);
    expect(html.indexOf('href="/mcp"')).toBeLessThan(html.indexOf('href="/contato"'));
    expect(html.indexOf('href="/sobre"')).toBeLessThan(html.indexOf('href="/mcp"'));
  });

  it('marks it current on /mcp', async () => {
    expect(await render({ current: '/mcp' })).toMatch(/<a[^>]*href="\/mcp"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/mcp"/);
  });
});

describe('SiteNav label alignment', () => {
  it('trims each label to its capitals, so the letters sit on the row centre', async () => {
    const html = await render({ hasPosts: true });
    const labels = html.match(/<a[^>]*>[\s\S]*?<\/a>/g) ?? [];
    expect(labels.length).toBeGreaterThan(0);
    for (const link of labels) expect(link).toMatch(/<span class="text-trim-cap">[^<]+<\/span>/);
  });
});

describe('SiteNav underline', () => {
  it('gives every desktop link the animated underline, and none of the mobile ones', async () => {
    const html = await render({ hasPosts: true });
    const desktop = html.slice(0, html.indexOf('id="site-menu"'));
    const mobile = html.slice(html.indexOf('id="site-menu"'));
    const desktopLinks = desktop.match(/<a\b[^>]*>/g) ?? [];
    expect(desktopLinks.length).toBeGreaterThan(0);
    for (const link of desktopLinks) expect(link).toMatch(/class="[^"]*\bnav-underline\b/);
    expect(mobile).not.toContain('nav-underline');
  });
});

describe('SiteNav item boxes', () => {
  it('makes each item a flex box, so the inline link adds no descender gap below it', async () => {
    const items = (await render({ hasPosts: true })).match(/<li[^>]*>/g) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item).toMatch(/class="[^"]*\bflex\b/);
  });
});

describe('SiteNav mobile hamburger menu', () => {
  it('opens a full-viewport popover from a hamburger that is hidden from md up', async () => {
    const html = await render({ hasPosts: true });

    expect(html).toMatch(
      /<button\b[^>]*type="button"[^>]*popovertarget="site-menu"[^>]*aria-label="Abrir menu"|<button\b[^>]*type="button"[^>]*aria-label="Abrir menu"[^>]*popovertarget="site-menu"/,
    );
    const open = html.match(/<button\b[^>]*aria-label="Abrir menu"[^>]*>/)?.[0] ?? '';
    expect(open).toMatch(/\bmd:hidden\b/);
    expect(open).toMatch(/\bsize-11\b/);

    expect(html).toMatch(
      /<div\b[^>]*id="site-menu"[^>]*popover[^>]*role="dialog"|<div\b[^>]*id="site-menu"[^>]*role="dialog"[^>]*popover/,
    );
    expect(html).toMatch(/id="site-menu"[^>]*class="[^"]*\bsite-menu\b|class="[^"]*\bsite-menu\b[^"]*"[^>]*id="site-menu"/);
    expect(html).toMatch(/aria-label="Menu"/);
  });

  it('closes the popover from a button labelled Fechar menu', async () => {
    const html = await render();
    const close = html.match(/<button\b[^>]*aria-label="Fechar menu"[^>]*>/)?.[0] ?? '';

    expect(close).toContain('popovertarget="site-menu"');
    expect(close).toContain('popovertargetaction="hide"');
    expect(close).toMatch(/\bsize-11\b/);
  });

  it('marks the close button as the animated one', async () => {
    const html = await render({ hasPosts: true });
    const close = html.match(/<button\b[^>]*aria-label="Fechar menu"[^>]*>/)?.[0] ?? '';
    expect(close).toMatch(/class="[^"]*\bsite-menu-close\b/);
  });

  // The rows share the height of the screen, like the reference site, instead
  // of a short list floating in the middle.
  it('stretches the items over the full height of the menu', async () => {
    const html = await render({ hasPosts: true });
    const menu = html.slice(html.indexOf('id="site-menu"'));
    const list = menu.match(/<ul\b[^>]*>/)?.[0] ?? '';
    expect(list).toMatch(/class="[^"]*\bflex-1\b/);
    const items = menu.match(/<li\b[^>]*>/g) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item).toMatch(/class="[^"]*\bflex-1\b/);
  });

  it('keeps the desktop list hidden on small screens and flex from md up', async () => {
    const html = await render();
    const desktopList =
      html.match(/<nav[^>]*aria-label="Navegação principal"[^>]*>[\s\S]*?<ul([^>]*)>/)?.[1] ?? '';

    expect(desktopList).toMatch(/\bhidden\b/);
    expect(desktopList).toMatch(/\bmd:flex\b/);
  });

  it('lists every item in the mobile menu in the same order as the desktop list', async () => {
    const html = await render({ hasPosts: true });
    const mobileNav =
      html.match(
        /<nav[^>]*aria-label="Menu principal \(mobile\)"[^>]*>([\s\S]*?)<\/nav>/,
      )?.[1] ?? '';
    const hrefs = [...mobileNav.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

    expect(hrefs).toEqual(['/posts', '/portfolio', '/lab', '/setup', '/now', '/sobre', '/mcp', '/contato']);
  });

  it('still ships with no client script', async () => {
    const html = await render();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('client:');
  });
});
