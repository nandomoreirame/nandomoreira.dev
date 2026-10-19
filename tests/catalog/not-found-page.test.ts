import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import NotFound from '../../src/pages/404.astro';

const render = async (path = '/caminho/que/nao/existe') => {
  const container = await AstroContainer.create();
  return container.renderToString(NotFound, { request: new Request(`https://nandomoreira.dev${path}`) });
};

describe('404 page', () => {
  it('sits on the canvas, without a card or the ~/404 path, with the big 404 and the status chip', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));
    expect(main).not.toContain('~/404');
    expect(main).not.toContain('data-page-path');
    expect(main).not.toMatch(/class="[^"]*\bbg-surface\b[^"]*\bp-xl\b/);
    expect(main).toMatch(/<p[^>]*class="[^"]*\bnot-found-code\b[^"]*"[^>]*>404<\/p>/);
    expect(main).toContain('STATUS: 404 NOT_FOUND');
    expect(main.match(/<h1[^>]*>Página não encontrada<\/h1>/g)).toHaveLength(1);
  });

  it('draws the 404 at three times the display size (1.5x the first cut)', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    const rule = css.match(/\.not-found-code\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule).toContain('font-size: calc(var(--text-display) * 3)');
  });

  it('shows the real curl of the requested path in a terminal window, with Copy', async () => {
    const html = await render();
    expect(html).toContain('data-terminal-bar');
    expect(html).toMatch(
      /<code id="not-found-curl">\$ curl -I https:\/\/nandomoreira\.dev\/caminho\/que\/nao\/existe\nHTTP\/2 404 Not Found<\/code>/,
    );
    expect(html).toMatch(/data-copy="not-found-curl"/);
  });

  it('escapes and caps a hostile path', async () => {
    const html = await render(`/${'a'.repeat(300)}%3Cscript%3E`);
    const code = html.match(/<code id="not-found-curl">([\s\S]*?)<\/code>/)?.[1] ?? '';
    expect(code).not.toContain('<script');
    expect(code.split('\n')[0]!.length).toBeLessThanOrEqual('$ curl -I https://nandomoreira.dev'.length + 200);
  });

  it('offers home as the primary way out, then the portfolio and the lab', async () => {
    const html = await render();
    // Button renders `class` before `href`. The primary treatment still has to sit on the home anchor.
    const homeLinks = [...html.matchAll(/<a\b[^>]*>/g)]
      .map(match => match[0])
      .filter(tag => /\bhref="\/"(?=[\s>])/.test(tag));
    expect(homeLinks.some(tag => /\bbg-primary\b/.test(tag))).toBe(true);
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/lab"');
  });

  it('invents nothing from the Stitch screen', async () => {
    const html = await render();
    for (const fake of [
      'HACKER_MODE',
      '0x7F',
      'cachyos-edge-router',
      'x-agent-status',
      'command not found',
      'Reportar link quebrado',
    ]) {
      expect(html).not.toContain(fake);
    }
  });

  it('keeps the 404 status and the noindex', () => {
    const source = readFileSync('src/pages/404.astro', 'utf8');
    expect(source).toContain('Astro.response.status = 404');
    expect(source).toContain('noindex');
  });
});
