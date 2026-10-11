import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav, { props });
};

describe('Agora in the menu', () => {
  it('sits between Setup and Sobre', async () => {
    const html = await render({ hasPosts: true });
    expect(html).toMatch(/<a[^>]*href="\/now"[^>]*>[\s\S]*?Agora/);
    expect(html.indexOf('href="/setup"')).toBeLessThan(html.indexOf('href="/now"'));
    expect(html.indexOf('href="/now"')).toBeLessThan(html.indexOf('href="/sobre"'));
  });

  it('marks /now as the current page', async () => {
    const html = await render({ current: '/now', hasPosts: true });
    expect(html).toMatch(
      /<a[^>]*href="\/now"[^>]*aria-current="page"|<a[^>]*aria-current="page"[^>]*href="\/now"/,
    );
  });

  it('redirects /agora to /now from the config, not from a page', () => {
    expect(readFileSync('astro.config.mjs', 'utf8')).toContain("'/agora': '/now'");
    expect(existsSync('src/pages/agora.astro')).toBe(false);
  });
});
