import { describe, expect, it } from 'vitest';
import { jsonLdForPost, serialiseJsonLd } from '../../src/lib/notes/note-ld';
import type { Post } from '../../src/content/schemas/post';

const note: Post = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses no Tailwind 4',
  summary: 'Colchetes geram CSS inválido.',
  date: '2026-08-09',
  draft: false,
};

const site = 'https://nandomoreira.dev';

describe('jsonLdForPost', () => {
  it('declares the schema.org context and a short-form text type', () => {
    const ld = jsonLdForPost(note, site);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toMatch(/Article|BlogPosting|TechArticle|CreativeWork/);
  });

  it('points at the canonical note URL', () => {
    expect(jsonLdForPost(note, site).url).toBe(
      'https://nandomoreira.dev/notas/por-que-parenteses-no-tailwind',
    );
  });

  it('never publishes the ordering date', () => {
    const ld = jsonLdForPost(note, site);
    const serialised = JSON.stringify(ld);

    expect(serialised).not.toContain('2026-08-09');
    expect(ld).not.toHaveProperty('datePublished');
    expect(ld).not.toHaveProperty('dateModified');
  });

  it('serialises through serialiseJsonLd, escaping angle brackets', () => {
    const ld = jsonLdForPost(
      { ...note, summary: 'Uses <script> tags carefully' },
      site,
    );
    const output = serialiseJsonLd(ld);

    expect(output).toContain('\\u003c');
    expect(output).not.toContain('<script>');
  });
});
