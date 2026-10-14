import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PORTRAIT, portraitUrl } from '../../src/lib/about/portrait';

describe('PORTRAIT', () => {
  it('points every source and the fallback at a file that ships in public/', () => {
    const files = [PORTRAIT.fallback, PORTRAIT.share, ...PORTRAIT.sources.flatMap((source) => source.srcset.split(', ').map((entry) => entry.split(' ')[0]!))];

    for (const file of files) expect(existsSync(`public${file}`), file).toBe(true);
  });

  it('offers AVIF before WebP, so browsers pick the smaller format first', () => {
    expect(PORTRAIT.sources.map((source) => source.type)).toEqual(['image/avif', 'image/webp']);
  });

  it('declares square intrinsic dimensions, so the layout does not shift', () => {
    expect(PORTRAIT.width).toBe(PORTRAIT.height);
    expect(PORTRAIT.width).toBeGreaterThan(0);
  });
});

describe('portraitUrl', () => {
  it('builds the absolute URL of the opaque share image, trimming the trailing slash of the site', () => {
    expect(portraitUrl('https://nandomoreira.dev/')).toBe(`https://nandomoreira.dev${PORTRAIT.share}`);
    expect(PORTRAIT.share).toMatch(/\.jpg$/);
  });
});
