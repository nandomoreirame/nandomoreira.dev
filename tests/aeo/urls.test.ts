import { describe, expect, it } from 'vitest';
import { absoluteUrl, canonicalUrl, pagePath, requireSite } from '../../src/lib/aeo/urls';

const SITE = new URL('https://nandomoreira.dev');

describe('requireSite', () => {
  it('returns the configured site', () => {
    expect(requireSite(SITE).origin).toBe('https://nandomoreira.dev');
  });

  it('fails loudly when site is not configured, instead of emitting relative urls', () => {
    expect(() => requireSite(undefined)).toThrow(/site/i);
  });
});

describe('absoluteUrl', () => {
  it('builds an absolute url from a path', () => {
    expect(absoluteUrl(SITE, '/projetos')).toBe('https://nandomoreira.dev/projetos');
  });

  it('normalises a missing leading slash', () => {
    expect(absoluteUrl(SITE, 'projetos')).toBe('https://nandomoreira.dev/projetos');
  });

  it('never emits a double slash', () => {
    expect(absoluteUrl(SITE, '//projetos')).not.toContain('dev//');
  });

  it('keeps the root path as a single slash', () => {
    expect(absoluteUrl(SITE, '/')).toBe('https://nandomoreira.dev/');
  });
});

describe('canonicalUrl', () => {
  it('drops the trailing slash, so /x and /x/ share one canonical', () => {
    expect(canonicalUrl(SITE, '/portfolio/abracce/')).toBe('https://nandomoreira.dev/portfolio/abracce');
    expect(canonicalUrl(SITE, '/posts')).toBe('https://nandomoreira.dev/posts');
  });

  it('keeps the root as a single slash', () => {
    expect(canonicalUrl(SITE, '/')).toBe('https://nandomoreira.dev/');
    expect(canonicalUrl(SITE, '')).toBe('https://nandomoreira.dev/');
  });
});

describe('pagePath', () => {
  it('turns the build-time path of a pre-rendered page into its public path', () => {
    expect(pagePath('/portfolio/abracce.html')).toBe('/portfolio/abracce');
    expect(pagePath('/posts/arquivo/2017/')).toBe('/posts/arquivo/2017');
    expect(pagePath('/index.html')).toBe('/');
    expect(pagePath('/')).toBe('/');
  });

  it('keeps the canonical free of the .html the file format adds', () => {
    expect(canonicalUrl(SITE, '/portfolio/abracce.html')).toBe('https://nandomoreira.dev/portfolio/abracce');
  });
});
