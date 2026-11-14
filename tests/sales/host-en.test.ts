import { describe, expect, it } from 'vitest';
import { rewriteTarget, salesLink, salesPath, salesRouting, salesUrl } from '../../src/lib/sales/host';

const at = (url: string) => salesRouting(new URL(url), true, true);
describe('English sales routing', () => {
  it.each([
    'https://contrate.nandomoreira.dev',
    'http://contrate.nandomoreira.local:4321',
    'http://contrate.nandomoreira.home',
  ])('rewrites English sales paths on %s', origin => {
    expect(at(`${origin}/en`)).toEqual({ rewrite: '/en/services' });
    expect(at(`${origin}/en/website`)).toEqual({ rewrite: '/en/services/website' });
  });
  it('redirects main-host English sales paths preserving the query', () => {
    expect(at('https://nandomoreira.dev/en/services/website?envio=ok')).toEqual({
      redirect: 'https://contrate.nandomoreira.dev/en/website?envio=ok',
    });
    expect(at('https://nandomoreira.dev/en/services')).toEqual({ redirect: 'https://contrate.nandomoreira.dev/en' });
    expect(at('http://localhost:4321/en/services')).toEqual({ redirect: 'http://contrate.nandomoreira.local:4321/en' });
  });
  it('leaves unrelated and reserved paths alone and respects rollback', () => {
    expect(at('https://nandomoreira.dev/en/about')).toBeUndefined();
    for (const path of ['/en/api', '/en/go', '/en/a/b', '/en/services', '/en/a.css'])
      expect(at(`https://contrate.nandomoreira.dev${path}`)).toBeUndefined();
    expect(salesRouting(new URL('https://contrate.nandomoreira.dev/en'), true, false)).toBeUndefined();
    expect(salesRouting(new URL('https://nandomoreira.dev/en/services'), true, false)).toBeUndefined();
  });
  it('builds localized public and internal links', () => {
    expect(salesPath(undefined, true, 'en')).toBe('/en');
    expect(salesPath('website', false, 'en')).toBe('/en/services/website');
    expect(salesUrl('website', true, 'en')).toBe('https://contrate.nandomoreira.dev/en/website');
    expect(salesLink(new URL('http://localhost:4321/en'), 'website', true, 'en')).toBe(
      'http://contrate.nandomoreira.local:4321/en/website',
    );
  });
});

describe('English sales routing edge cases', () => {
  it('rewrites English paths with a trailing slash on the sales host', () => {
    expect(at('https://contrate.nandomoreira.dev/en/')).toEqual({ rewrite: '/en/services' });
    expect(at('https://contrate.nandomoreira.dev/en/website/')).toEqual({ rewrite: '/en/services/website' });
  });
  it('keeps the form outcome on the English rewrite', () => {
    const url = new URL('https://contrate.nandomoreira.dev/en?envio=ok');
    const route = salesRouting(url, true, true) as { rewrite: string };
    expect(rewriteTarget(route.rewrite, url)).toBe('/en/services?envio=ok');
  });
});
