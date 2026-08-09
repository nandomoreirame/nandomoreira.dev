import { describe, expect, it } from 'vitest';
import { noteSchema } from '../../src/content/schemas/note';

const valid = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses e não colchetes no Tailwind 4',
  summary: 'A sintaxe de colchete gera CSS inválido que o browser descarta em silêncio.',
  date: '2026-08-09',
  draft: false,
};

describe('noteSchema', () => {
  it('accepts a complete note', () => {
    expect(noteSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['slug', 'title', 'summary', 'date'])('rejects a note missing %s', (field) => {
    const { [field as keyof typeof valid]: _dropped, ...incomplete } = valid;
    expect(noteSchema.safeParse(incomplete).success).toBe(false);
  });

  it('requires the slug to be kebab-case, since it is the route', () => {
    expect(noteSchema.safeParse({ ...valid, slug: 'Nao Kebab' }).success).toBe(false);
  });

  it('requires an ISO-8601 date, used only for ordering and machine routes', () => {
    expect(noteSchema.safeParse({ ...valid, date: '09/08/2026' }).success).toBe(false);
  });

  it('defaults draft to false, so publishing is the explicit act', () => {
    const { draft: _dropped, ...withoutDraft } = valid;
    const result = noteSchema.safeParse(withoutDraft);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.draft).toBe(false);
  });

  it('accepts optional subject markers', () => {
    expect(noteSchema.safeParse({ ...valid, markers: ['Tailwind'] }).success).toBe(true);
  });

  it('rejects an empty marker', () => {
    expect(noteSchema.safeParse({ ...valid, markers: [''] }).success).toBe(false);
  });
});
