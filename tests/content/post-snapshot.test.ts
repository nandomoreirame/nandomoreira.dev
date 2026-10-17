import type { SchemaContext } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { postSchema } from '../../src/content/schemas/post';

const post = postSchema({ image: (() => z.string()) as unknown as SchemaContext['image'] });
const base = { slug: 'exemplo', title: 'Exemplo', summary: 's', date: '2026-10-17', markers: ['a', 'b', 'c'] };
const item = (label = 'OS', value = 'CachyOS Linux') => ({ label, value });

describe('post snapshot', () => {
  it('is optional', () => {
    expect(post.safeParse(base).success).toBe(true);
  });

  it('keeps one to six label/value pairs and an optional version', () => {
    const parsed = post.safeParse({ ...base, snapshot: { version: 'v0.1.9', items: [item(), item('Compositor', 'Niri')] } });
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.snapshot).toEqual({
      version: 'v0.1.9',
      items: [item(), item('Compositor', 'Niri')],
    });
    expect(post.safeParse({ ...base, snapshot: { items: [item()] } }).success).toBe(true);
  });

  it('rejects no items, a seventh item, empty or long labels and values, and a long version', () => {
    expect(post.safeParse({ ...base, snapshot: { items: [] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: Array.from({ length: 7 }, () => item()) } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('', 'x')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x'.repeat(21), 'x')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x', '')] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { items: [item('x', 'x'.repeat(33))] } }).success).toBe(false);
    expect(post.safeParse({ ...base, snapshot: { version: 'x'.repeat(17), items: [item()] } }).success).toBe(false);
  });
});
