import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CommandPalette from '../../src/components/search/CommandPalette.astro';
import { buildSearchIndex } from '../../src/lib/search/build-index';
import { GO_TARGETS, PALETTE_COPY, paletteCopy } from '../../src/lib/search/copy';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('palette copy by locale (REQ-024)', () => {
  it('keeps the pt-BR strings on the current export', () => {
    expect(paletteCopy('pt-BR').groups.general).toBe('Geral');
    expect(PALETTE_COPY.groups.general).toBe('Geral');
    expect(GO_TARGETS.map(target => target.path)).toContain('/sobre');
  });

  it('translates the chrome and keeps paths', () => {
    const copy = paletteCopy('en');
    expect(ptLeftovers(`<p>${JSON.stringify(copy)}</p>`)).toEqual([]);
    expect(copy.groups.general).not.toBe('Geral');
    expect(GO_TARGETS.map(target => target.key).sort()).toEqual(
      ['b', 'c', 'h', 'l', 'm', 'n', 'p', 's', 'u', 'v'].sort(),
    );
  });

  it('renders the dialog in English', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(CommandPalette, {
      props: { locale: 'en' },
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('builds static page titles in English and leaves posts for later', () => {
    const index = buildSearchIndex({
      locale: 'en',
      current: [],
      archived: [],
      projects: [],
      services: [],
      landingUrl: 'https://contrate.nandomoreira.dev/',
    });
    const about = index.find(item => item.path === '/sobre');
    expect(about?.title).toBe('About');
    expect(about?.path).toBe('/sobre');
  });
});

describe('palette loader', () => {
  const source = readFileSync('src/scripts/palette.ts', 'utf8');

  it('fetches the English index when the page is English', () => {
    expect(source).toContain('/en/search.json');
    expect(source).toContain('documentElement.lang');
  });
});
