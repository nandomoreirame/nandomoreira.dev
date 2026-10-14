import { describe, expect, it } from 'vitest';
import { isMachineSurface, measurementFor } from '../../src/lib/analytics/surface';

const html = 'text/html; charset=utf-8';
const measure = (overrides: Partial<Parameters<typeof measurementFor>[0]> = {}) =>
  measurementFor({ method: 'GET', path: '/sobre', status: 200, contentType: html, headers: new Headers(), ...overrides });

describe('isMachineSurface', () => {
  it.each(['/llms.txt', '/llms-full.txt', '/AGENTS.md', '/ai-index.json', '/api/resume.json', '/api/resume.txt', '/index.md', '/lab/forja.md', '/ia', '/sobre/ia'])(
    '%s is a machine surface',
    (path) => expect(isMachineSurface(path)).toBe(true),
  );

  it.each(['/', '/sobre', '/lab/forja', '/media', '/api/hire'])('%s is not', (path) => {
    expect(isMachineSurface(path)).toBe(false);
  });
});

describe('measurementFor', () => {
  it('counts a 2xx HTML GET as a pageview', () => {
    expect(measure()).toBe('pageview');
  });

  it('counts a machine surface even when it answers HTML', () => {
    expect(measure({ path: '/sobre/ia' })).toBe('machine');
    expect(measure({ path: '/llms.txt', contentType: 'text/plain' })).toBe('machine');
  });

  it('ignores HEAD, errors, redirects, non-HTML and prefetches', () => {
    expect(measure({ method: 'HEAD' })).toBeNull();
    expect(measure({ status: 404 })).toBeNull();
    expect(measure({ status: 301 })).toBeNull();
    expect(measure({ path: '/api/health', contentType: 'application/json' })).toBeNull();
    expect(measure({ headers: new Headers({ 'sec-purpose': 'prefetch;prerender' }) })).toBeNull();
    expect(measure({ headers: new Headers({ purpose: 'prefetch' }) })).toBeNull();
  });
});
