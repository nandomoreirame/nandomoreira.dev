import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('404 handling', () => {
  it('ships a 404 page', () => {
    expect(existsSync('src/pages/404.astro')).toBe(true);
  });

  it('keeps the page out of the index', () => {
    expect(readFileSync('src/pages/404.astro', 'utf8')).toContain('noindex');
  });

  it('sends visitors back to the catalogue instead of a dead end', () => {
    // The real route: /projetos only survives as a legacy 301.
    expect(readFileSync('src/pages/404.astro', 'utf8')).toContain('href="/portfolio"');
  });
});
