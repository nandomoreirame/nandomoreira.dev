import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/[slug].astro', 'utf8');

describe('/projetos/[slug]', () => {
  it('derives its paths from the access layer, not from a hand-written list', () => {
    expect(page).toContain('getAllProjects');
    expect(page).not.toContain('getCollection(');
  });

  it('permanently redirects each case to its collection path', () => {
    expect(page).toContain('collectionOfBlock');
    expect(page).toContain('Astro.redirect');
    expect(page).toMatch(/301/);
  });
});
