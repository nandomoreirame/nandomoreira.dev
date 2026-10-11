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

describe('SiteNav item boxes', () => {
  it('makes each item a flex box, so the inline link adds no descender gap below it', async () => {
    const items = (await render({ hasPosts: true })).match(/<li[^>]*>/g) ?? [];
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) expect(item).toMatch(/class="[^"]*\bflex\b/);
  });
});
