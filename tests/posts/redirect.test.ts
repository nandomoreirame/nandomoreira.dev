import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = () => readFileSync('astro.config.mjs', 'utf8');

describe('/notas redirects to /posts', () => {
  it('declares permanent redirects in astro.config, not pre-rendered pages', () => {
    const source = config();

    expect(source).toMatch(/redirects\s*:\s*\{/);
    expect(source).toMatch(/['"]\/notas['"]\s*:\s*['"]\/posts['"]/);
    expect(source).toMatch(/['"]\/notas\/\[slug\]['"]\s*:\s*['"]\/\[slug\]['"]/);

    // Legacy page routes must be gone: prerender + Astro.redirect yields 200 + meta refresh.
    expect(existsSync('src/pages/notas')).toBe(false);
  });
});
