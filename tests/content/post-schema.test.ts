import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

/** Unit tests mock Astro's image() with a plain string path. */
const schema = postSchema({
  image: (() => z.string()) as unknown as SchemaContext['image'],
});

const valid = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses e não colchetes no Tailwind 4',
  summary: 'A sintaxe de colchete gera CSS inválido que o browser descarta em silêncio.',
  date: '2026-08-09',
  draft: false,
};

const base = {
  slug: 'exemplo',
  title: 'Exemplo',
  summary: 's',
  date: '2015-09-30',
};

describe('postSchema', () => {
  it('accepts a complete post', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it.each(['slug', 'title', 'summary', 'date'])('rejects a post missing %s', (field) => {
    const { [field as keyof typeof valid]: _dropped, ...incomplete } = valid;
    expect(schema.safeParse(incomplete).success).toBe(false);
  });

  it('requires the slug to be kebab-case, since it is the route', () => {
    expect(schema.safeParse({ ...valid, slug: 'Nao Kebab' }).success).toBe(false);
  });

  it('requires an ISO-8601 date, used only for ordering and machine routes', () => {
    expect(schema.safeParse({ ...valid, date: '09/08/2026' }).success).toBe(false);
  });

  it('defaults draft to false, so publishing is the explicit act', () => {
    const { draft: _dropped, ...withoutDraft } = valid;
    const result = schema.safeParse(withoutDraft);

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.draft).toBe(false);
  });

  it('accepts optional subject markers', () => {
    expect(schema.safeParse({ ...valid, markers: ['Tailwind'] }).success).toBe(true);
  });

  it('rejects an empty marker', () => {
    expect(schema.safeParse({ ...valid, markers: [''] }).success).toBe(false);
  });

  it('defaults to current, so a new post needs no ceremony', () => {
    expect(schema.parse(base).archived).toBe(false);
  });

  it('accepts an archived post', () => {
    expect(schema.parse({ ...base, archived: true }).archived).toBe(true);
  });

  it('requires alt text whenever a cover image is declared', () => {
    // Same rule the case catalogue already applies: an image is content.
    expect(() => schema.parse({ ...base, cover: { src: './x.png' } })).toThrow();
  });

  it('accepts a cover with src and alt', () => {
    const result = schema.parse({
      ...base,
      cover: { src: './x.png', alt: 'Screenshot of the Gulp CLI' },
    });
    expect(result.cover?.alt).toBe('Screenshot of the Gulp CLI');
  });
});
