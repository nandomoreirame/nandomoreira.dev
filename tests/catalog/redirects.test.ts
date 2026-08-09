import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('legacy /projetos redirects', () => {
  it('redirects the catalogue index permanently to /portfolio', () => {
    const source = read('src/pages/projetos/index.astro');

    expect(source).toContain("Astro.redirect('/portfolio'");
    expect(source).toMatch(/301/);
  });

  it('redirects each case slug permanently to its collection path', () => {
    const source = read('src/pages/projetos/[slug].astro');

    expect(source).toContain('getAllProjects');
    expect(source).toContain('collectionOfBlock');
    expect(source).toContain('Astro.redirect');
    expect(source).toMatch(/301/);
    expect(source).not.toContain('getCollection(');
  });
});

describe('new case routes', () => {
  it.each(['src/pages/portfolio/[slug].astro', 'src/pages/lab/[slug].astro'])(
    '%s derives paths from the access layer',
    (path) => {
      const source = read(path);

      expect(source).toContain('getAllProjects');
      expect(source).toContain('collectionOfBlock');
      expect(source).not.toContain('getCollection(');
      expect(source).toContain('CaseArticle');
    },
  );
});
