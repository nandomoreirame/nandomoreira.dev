import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { executableScripts, scriptViolations } from './client-scripts';

const POINTER = "document.querySelectorAll('[data-pointer-field]')";

describe('executableScripts', () => {
  it('ignores JSON-LD data blocks', () => {
    const html = '<script type="application/ld+json">{"@type":"Person"}</script>';
    expect(executableScripts(html)).toEqual([]);
  });

  it('returns inline scripts, which is how Astro ships a small component script', () => {
    expect(executableScripts(`<script type="module">${POINTER}</script>`)).toEqual([POINTER]);
  });

  it('reads an external script through the given reader', () => {
    const html = '<script type="module" src="/_astro/x.js"></script>';
    expect(executableScripts(html, () => POINTER)).toEqual([POINTER]);
  });
});

describe('scriptViolations', () => {
  it('accepts the pointer effect on the listings and on a case page', () => {
    expect(
      scriptViolations([
        { route: '/lab', scripts: [POINTER] },
        { route: '/portfolio/financial-normalization', scripts: [POINTER] },
      ]),
    ).toEqual([]);
  });

  it('rejects any other script, inline or not', () => {
    expect(scriptViolations([{ route: '/sobre', scripts: ['console.log(1)'] }])).toEqual([
      '/sobre: script outside the allowlist',
    ]);
  });

  it('rejects the pointer effect outside /portfolio, /lab and case pages', () => {
    expect(scriptViolations([{ route: '/', scripts: [POINTER] }])).toEqual([
      '/: pointer effect outside /portfolio, /lab and case pages',
    ]);
  });

  it('rejects the pointer effect above 1.5 KB gzip', () => {
    const bloated = `${POINTER};${randomBytes(3000).toString('hex')}`;
    const [violation] = scriptViolations([{ route: '/lab', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/lab: pointer effect is \d+ B gzip, budget 1536$/);
  });
});
