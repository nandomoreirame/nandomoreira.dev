import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// A pre-rendered page reflects exactly what the server sends for SSR ones.
const PAGE = 'dist/client/lab/forja/index.html';

describe('built page delivery (PageSpeed mobile)', () => {
  const html = readFileSync(PAGE, 'utf8');

  it('has no render-blocking stylesheet link, the CSS is inline', () => {
    expect(html).not.toMatch(/<link[^>]*rel="stylesheet"/);
    expect(html).toMatch(/<style[^>]*>[\s\S]*@font-face/);
  });

  it('points every font at a fingerprinted /_astro/ asset', () => {
    const fonts = [...html.matchAll(/url\(([^)]+\.woff2)\)/g)].map((match) => match[1].replace(/["']/g, ''));
    expect(fonts.length).toBeGreaterThan(0);
    for (const font of fonts) expect(font).toMatch(/^\/_astro\/[\w-]+\.[\w-]+\.woff2$/);
  });

  it('preloads the two above-the-fold faces from /_astro/', () => {
    const preloads = [...html.matchAll(/<link[^>]*rel="preload"[^>]*href="([^"]+)"/g)].map((match) => match[1]);
    expect(preloads.filter((href) => href.startsWith('/_astro/') && href.endsWith('.woff2'))).toHaveLength(2);
  });
});
