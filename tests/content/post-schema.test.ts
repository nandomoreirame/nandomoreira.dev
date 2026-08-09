import { describe, expect, it } from 'vitest';
import { postSchema } from '../../src/content/schemas/post';

const valid = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses e não colchetes no Tailwind 4',
  summary: 'A sintaxe de colchete gera CSS inválido que o browser descarta em silêncio.',
  date: '2026-08-09',
  draft: false,
};

describe('postSchema', () => {
  it('accepts a complete post', () => {
    expect(postSchema.safeParse(valid).success).toBe(true);
  });

  it.each(['slug', 'title', 'summary', 'date'])('rejects a post missing %s', (field) => {
    const { [field as keyof typeof valid]: _dropped, ...incomplete } = valid;
    expect(postSchema.safeParse(incomplete).success).toBe(false);
  });

  it('requires the slug to be kebab-case, since it is the route', () => {
    expect(postSchema.safeParse({ ...valid, slug: 'Nao Kebab' }).success).toBe(false);
  });

  it('requires an ISO-8601 date, used only for ordering and machine routes', () => {
    expect(postSchema.safeParse({ ...valid, date: '09/08/2026' }).success).toBe(false);
  });

  it('defaults draft to false, so publishing is the explicit act', () => {
    const { draft: _dropped, ...withoutDraft } = valid;
    const result = postSchema.safeParse(withoutDraft);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.draft).toBe(false);
  });

  it('accepts optional subject markers', () => {
    expect(postSchema.safeParse({ ...valid, markers: ['Tailwind'] }).success).toBe(true);
  });

  it('rejects an empty marker', () => {
    expect(postSchema.safeParse({ ...valid, markers: [''] }).success).toBe(false);
  });
});
