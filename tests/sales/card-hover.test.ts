import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Detail from '../../src/pages/servicos/[slug].astro';
import Landing from '../../src/pages/servicos/index.astro';

/**
 * A card is a surface bounded by the hairline; every one lifts its border on
 * hover. The hero art's outer frame is decoration, not a card: only the
 * windows inside it react (2026-10-18).
 */
const cards = (html: string) =>
  [...html.matchAll(/<[^>]*\bclass="([^"]*)"[^>]*>/g)]
    .filter(match => !match[0].includes('data-hero-art'))
    .map(match => match[1]!)
    .filter(cls => /\bborder-border(?!-)\b/.test(cls) && /\bbg-surface(?!-)\b/.test(cls));

describe('card hover on the sales pages', () => {
  it.each([
    ['/servicos', Landing, {}],
    ['/servicos/site-institucional', Detail, { slug: 'site-institucional' }],
  ])('%s softens every card border on hover', async (path, page, params) => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(page as never, {
      params,
      request: new Request(`https://nandomoreira.dev${path}`),
    });
    const list = cards(html);
    expect(list.length).toBeGreaterThan(10);
    for (const card of list) {
      expect(card, card).toContain('hover:border-border-strong');
      expect(card, card).toContain('transition-[border-color]');
    }
  });

  it.each([
    ['/servicos', Landing, {}],
    ['/servicos/site-institucional', Detail, { slug: 'site-institucional' }],
  ])('%s has no noop hover on already-strong borders', async (path, page, params) => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(page as never, {
      params,
      request: new Request(`https://nandomoreira.dev${path}`),
    });
    const strongWithHover = [...html.matchAll(/class="([^"]*)"/g)]
      .map(match => match[1]!)
      .filter(cls => {
        const tokens = cls.split(/\s+/);
        return tokens.includes('border-border-strong') && tokens.includes('hover:border-border-strong');
      });
    expect(strongWithHover).toEqual([]);
  });

  it('keeps the hero frame still and lifts only the windows inside it', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(Landing as never, {
      request: new Request('https://nandomoreira.dev/servicos'),
    });
    const frame = html.match(/<div[^>]*data-hero-art[^>]*>/)?.[0] ?? '';
    expect(frame).not.toBe('');
    expect(frame).not.toContain('hover:border');
    const start = html.indexOf('data-hero-art');
    const art = html.slice(start, html.indexOf('</section>', start));
    expect(art.match(/hover:border-(border-strong|primary)/g)).toHaveLength(3);
  });
});
