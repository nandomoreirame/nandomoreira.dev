import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/index.astro', 'utf8');

describe('/projetos', () => {
  it('permanently redirects to the portfolio listing', () => {
    expect(page).toContain("Astro.redirect('/portfolio'");
    expect(page).toMatch(/301/);
  });
});
