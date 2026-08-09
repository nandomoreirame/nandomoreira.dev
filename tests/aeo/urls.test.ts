import { describe, expect, it } from 'vitest';
import { absoluteUrl, requireSite } from '../../src/lib/aeo/urls';

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
