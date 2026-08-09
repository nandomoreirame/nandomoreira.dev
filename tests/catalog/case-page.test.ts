import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/projetos/[slug].astro', 'utf8');

describe('/projetos/[slug]', () => {
  it('derives its paths from the access layer, not from a hand-written list', () => {
    expect(page).toContain('getAllProjects');
    expect(page).not.toContain('getCollection(');
  });

  it('offers a way back to the catalogue', () => {
    expect(page).toContain('href="/projetos"');
  });

  it('embeds the per-case structured data', () => {
    expect(page).toContain('application/ld+json');
    expect(page).toContain('serialiseJsonLd');
  });
});
