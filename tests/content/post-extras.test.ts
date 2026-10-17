import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };

describe('post extras', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('takes one or two short lines', () => {
    expect(post.safeParse({ ...base, extras: ['5 dias → 30 min'] }).success).toBe(true);
    expect(post.safeParse({ ...base, extras: ['5 dias → 30 min', 'Python · Polars'] }).success).toBe(true);
  });

  it('rejects an empty list, a third line and a line over 60 characters', () => {
    expect(post.safeParse({ ...base, extras: [] }).success).toBe(false);
    expect(post.safeParse({ ...base, extras: ['a', 'b', 'c'] }).success).toBe(false);
    expect(post.safeParse({ ...base, extras: ['x'.repeat(61)] }).success).toBe(false);
  });
});
