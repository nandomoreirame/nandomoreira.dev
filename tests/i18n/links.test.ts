import { describe, expect, it } from 'vitest';
import { englishHref, internalLinks } from '../../src/lib/i18n/links';

const pairs = [{ 'pt-BR': '/o-falso-verde', en: '/en/the-false-green' }];

describe('englishHref', () => {
  it('maps a pt-BR page with a pair to its English path, keeping the hash', () => {
    expect(englishHref('/o-falso-verde#setup', pairs)).toBe('/en/the-false-green#setup');
    expect(englishHref('/sobre', pairs)).toBe('/en/about');
    expect(englishHref('https://nandomoreira.dev/sobre', pairs)).toBe('/en/about');
  });

  it('keeps links without a pair and external links', () => {
    expect(englishHref('/posts/arquivo/2017', pairs)).toBe('/posts/arquivo/2017');
    expect(englishHref('https://github.com/x', pairs)).toBe('https://github.com/x');
  });
});

describe('internalLinks', () => {
  it('lists root-relative and own-domain markdown links, not images or code', () => {
    const body = 'See [a](/sobre) and [b](https://nandomoreira.dev/now), ![i](/img.png), `[c](/x)` and [d](https://x.dev).';
    expect(internalLinks(body)).toEqual(['/sobre', 'https://nandomoreira.dev/now']);
  });
});
