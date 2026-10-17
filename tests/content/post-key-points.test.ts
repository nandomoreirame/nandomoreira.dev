import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };

describe('post keyPoints', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('keeps one to three short takeaways', () => {
    const parsed = post.safeParse({ ...base, keyPoints: ['um', 'dois', 'três'] });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.keyPoints).toEqual(['um', 'dois', 'três']);
  });

  it('rejects an empty list, a fourth item, an empty item and an item over 140 characters', () => {
    expect(post.safeParse({ ...base, keyPoints: [] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: ['a', 'b', 'c', 'd'] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: [''] }).success).toBe(false);
    expect(post.safeParse({ ...base, keyPoints: ['x'.repeat(141)] }).success).toBe(false);
  });
});
