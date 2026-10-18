import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The sales host rewrites `/` to `/servicos` at request time, and Astro forbids
 * a request-time rewrite into a prerendered route (ForbiddenRewrite). Without
 * its own on-demand page, `/servicos` falls into the prerendered post route
 * `src/pages/[slug].astro` and the subdomain answers 500 (seen 2026-10-18).
 */
describe('sales routes render on demand', () => {
  it('has its own page for /servicos, rendered on the server', () => {
    const page = 'src/pages/servicos/index.astro';
    expect(existsSync(page)).toBe(true);
    expect(readFileSync(page, 'utf8')).toMatch(/export const prerender = false/);
  });
});
