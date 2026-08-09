import { describe, expect, it } from 'vitest';
import { jsonLdForNote, serialiseJsonLd } from '../../src/lib/notes/note-ld';
import type { Note } from '../../src/content/schemas/note';

const note: Note = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses no Tailwind 4',
  summary: 'Colchetes geram CSS inválido.',
  date: '2026-08-09',
  draft: false,
};

const site = 'https://nandomoreira.dev';

describe('jsonLdForNote', () => {
  it('declares the schema.org context and a short-form text type', () => {
    const ld = jsonLdForNote(note, site);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toMatch(/Article|BlogPosting|TechArticle|CreativeWork/);
  });

  it('points at the canonical note URL', () => {
    expect(jsonLdForNote(note, site).url).toBe(
      'https://nandomoreira.dev/notas/por-que-parenteses-no-tailwind',
    );
  });

  it('never publishes the ordering date', () => {
    const ld = jsonLdForNote(note, site);
    const serialised = JSON.stringify(ld);

    expect(serialised).not.toContain('2026-08-09');
    expect(ld).not.toHaveProperty('datePublished');
    expect(ld).not.toHaveProperty('dateModified');
  });

  it('serialises through serialiseJsonLd, escaping angle brackets', () => {
    const ld = jsonLdForNote(
      { ...note, summary: 'Uses <script> tags carefully' },
      site,
    );
    const output = serialiseJsonLd(ld);

    expect(output).toContain('\\u003c');
    expect(output).not.toContain('<script>');
  });
});
