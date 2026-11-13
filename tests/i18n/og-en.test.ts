import { describe, expect, it } from 'vitest';
import { englishOgPages } from '../../src/lib/og/pages';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('English share cards', () => {
  it('has one card per English static page, keyed under en/', async () => {
    const pages = await englishOgPages(true);
    const keys = pages.map((page) => page.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'en',
        'en/about',
        'en/contact',
        'en/portfolio',
        'en/lab',
        'en/posts',
        'en/now',
        'en/setup',
        'en/mcp',
        'en/privacy',
        'en/resume',
      ]),
    );
    for (const page of pages) expect(ptLeftovers(`<p>${page.title} ${page.eyebrow}</p>`)).toEqual([]);
  });

  it('has none while English is not live', async () => {
    expect(await englishOgPages(false)).toEqual([]);
  });
});
