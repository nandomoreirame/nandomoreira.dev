import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav, { props });
};

describe('Agora in the menu', () => {
  it('follows the menu order Sobre, Agora, Setup, Blog, Portfolio, Lab, MCP, Contato', async () => {
    const html = await render({ hasPosts: true });
    expect(html).toMatch(/<a[^>]*href="\/now"[^>]*>[\s\S]*?Agora/);
    const desktop = html.slice(0, html.indexOf('id="site-menu"'));
    const order = ['/sobre', '/now', '/setup', '/posts', '/portfolio', '/lab', '/mcp', '/contato'].map(path =>
      desktop.indexOf(`href="${path}"`),
    );
    expect(order.every(index => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('marks /now as the current page', async () => {
    const html = await render({ current: '/now', hasPosts: true });
    expect(html).toMatch(/<a[^>]*href="\/now"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/now"/);
  });

  it('redirects /agora to /now from the config, not from a page', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain("'/agora': '/now'");
    expect(existsSync('src/pages/agora.astro')).toBe(false);
  });
});
