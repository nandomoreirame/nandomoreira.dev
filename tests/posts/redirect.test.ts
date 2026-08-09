import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('/notas redirects to /posts', () => {
  it('keeps a permanent redirect from the never-indexed /notas path', () => {
    const source = readFileSync('src/pages/notas/index.astro', 'utf8');
    expect(source).toContain("Astro.redirect('/posts'");
    expect(source).toMatch(/301/);
  });

  it('redirects legacy note detail slugs to the root post path', () => {
    const source = readFileSync('src/pages/notas/[slug].astro', 'utf8');
    expect(source).toContain('Astro.redirect');
    expect(source).toMatch(/301/);
    expect(source).toContain('getAllPosts');
  });
});
