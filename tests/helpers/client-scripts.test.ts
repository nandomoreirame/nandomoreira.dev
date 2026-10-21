import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { THEME_BOOT_BUDGET_BYTES, THEME_BOOT_SCRIPT } from '../../src/lib/theme/boot';
import {
  PALETTE_BUDGET_BYTES,
  PALETTE_MARKER,
  executableScripts,
  paletteChunkViolations,
  scriptViolations,
} from './client-scripts';

const POINTER = "document.querySelectorAll('[data-pointer-field]')";
const PREVIEW = "document.querySelectorAll('[data-now-preview]')";

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

  it('accepts the pointer effect on every page, since it covers the whole site', () => {
    expect(
      scriptViolations([
        { route: '/', scripts: [POINTER] },
        { route: '/sobre', scripts: [POINTER] },
        { route: '/fluxo-rpi-claude-code-grok-codex', scripts: [POINTER] },
      ]),
    ).toEqual([]);
  });

  it('rejects the pointer effect above 2304 B gzip', () => {
    const bloated = `${POINTER};${randomBytes(3000).toString('hex')}`;
    const [violation] = scriptViolations([{ route: '/lab', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/lab: pointer effect is \d+ B gzip, budget 2304$/);
  });

  it('accepts the pointer effect with the palette loader, up to 2304 B gzip', () => {
    // Random hex compresses to about half: ~3600 chars land near 1.9 KB gzip, above the old 1536.
    const loaded = `${POINTER};${randomBytes(1800).toString('hex')}`;
    expect(scriptViolations([{ route: '/lab', scripts: [loaded] }])).toEqual([]);
  });

  it('accepts the audio preview script on /now, beside the pointer effect', () => {
    expect(scriptViolations([{ route: '/now', scripts: [POINTER, PREVIEW] }])).toEqual([]);
  });

  it('rejects the audio preview script on any other page', () => {
    expect(scriptViolations([{ route: '/sobre', scripts: [POINTER, PREVIEW] }])).toEqual([
      '/sobre: audio preview outside /now',
    ]);
  });

  it('rejects the audio preview above 1 KB gzip', () => {
    const bloated = `${PREVIEW};${randomBytes(3000).toString('hex')}`;
    const [violation] = scriptViolations([{ route: '/now', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/now: audio preview is \d+ B gzip, budget 1024$/);
  });

  it('still rejects a third, unnamed script on /now', () => {
    expect(scriptViolations([{ route: '/now', scripts: [POINTER, PREVIEW, 'console.log(1)'] }])).toEqual([
      '/now: script outside the allowlist',
    ]);
  });
});

describe('command palette exception', () => {
  it('refuses the palette as a script on the page itself', () => {
    expect(scriptViolations([{ route: '/', scripts: [`document.querySelector('[${PALETTE_MARKER}]')`] }])).toEqual([
      '/: script outside the allowlist',
    ]);
  });

  it('accepts an on-demand chunk within budget and refuses a bigger one', () => {
    expect(paletteChunkViolations([{ file: 'palette.js', body: `/*${PALETTE_MARKER}*/` }])).toEqual([]);
    // Random bytes do not compress, so the gzip size really exceeds the budget; the marker stays intact.
    const big = `${PALETTE_MARKER}${randomBytes(PALETTE_BUDGET_BYTES * 2).toString('base64')}`;
    expect(paletteChunkViolations([{ file: 'palette.js', body: big }])[0]).toMatch(
      /palette\.js: command palette is \d+ B gzip, budget 4096/,
    );
  });

  it('ignores an oversized chunk without the palette marker', () => {
    const other = randomBytes(PALETTE_BUDGET_BYTES * 2).toString('base64');
    expect(paletteChunkViolations([{ file: 'vendor.js', body: other }])).toEqual([]);
  });
});

describe('theme boot exception (theme-modes, REQ-010)', () => {
  it('accepts the theme boot on every page', () => {
    expect(
      scriptViolations([
        { route: '/', scripts: [THEME_BOOT_SCRIPT] },
        { route: '/sobre', scripts: [THEME_BOOT_SCRIPT] },
        { route: '/portfolio/forja', scripts: [THEME_BOOT_SCRIPT] },
      ]),
    ).toEqual([]);
  });

  it('rejects a theme boot over budget', () => {
    const bloated = `${THEME_BOOT_SCRIPT}/*${randomBytes(THEME_BOOT_BUDGET_BYTES * 2).toString('base64')}*/`;
    const [violation] = scriptViolations([{ route: '/', scripts: [bloated] }]);
    expect(violation).toMatch(/^\/: theme boot is \d+ B gzip, budget 512$/);
  });
});
