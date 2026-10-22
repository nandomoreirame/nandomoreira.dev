import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_CHARS,
  LIMITS,
  REVIEW_APP_ID,
  REVIEW_EVENTS,
  SLUG_PATTERN,
  annotationSchema,
  reviewPayloadSchema,
  storageKey,
} from '../../src/lib/post-review/schema';

const annotation = {
  quote: 'um trecho',
  prefix: 'antes ',
  suffix: ' depois',
  section: 'Contexto',
  request: 'deixa mais curto',
  replacement: '',
  start: 10,
  end: 19,
};

describe('post-review schema', () => {
  it('names the app, the events and the storage key', () => {
    expect(REVIEW_APP_ID).toBe('post-review');
    expect(REVIEW_EVENTS).toEqual({
      save: 'post-review:save',
      saved: 'post-review:saved',
      failed: 'post-review:failed',
    });
    expect(storageKey('meu-post')).toBe('post-review:meu-post');
    expect(CONTEXT_CHARS).toBe(32);
    expect(LIMITS).toEqual({ quote: 2000, request: 2000, replacement: 4000, annotations: 100 });
  });

  it('accepts every existing post file name as a slug', () => {
    const slugs = readdirSync('src/content/posts').map(name => name.replace(/\.md$/, ''));
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) expect(SLUG_PATTERN.test(slug), slug).toBe(true);
  });

  it('refuses a slug that could become a path', () => {
    for (const slug of ['../etc/passwd', 'a/b', 'A', '', 'x.md']) {
      expect(reviewPayloadSchema.safeParse({ slug, annotations: [annotation] }).success, slug).toBe(false);
    }
  });

  it('accepts a request alone or a replacement alone', () => {
    expect(annotationSchema.safeParse(annotation).success).toBe(true);
    expect(annotationSchema.safeParse({ ...annotation, request: '', replacement: 'novo' }).success).toBe(true);
  });

  it('refuses an annotation with neither request nor replacement', () => {
    const result = annotationSchema.safeParse({ ...annotation, request: '  ', replacement: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('Escreva o pedido ou o texto novo');
  });

  it('enforces the limits and a non-empty range', () => {
    expect(annotationSchema.safeParse({ ...annotation, quote: '' }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, quote: 'x'.repeat(2001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, request: 'x'.repeat(2001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, replacement: 'x'.repeat(4001) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, prefix: 'x'.repeat(33) }).success).toBe(false);
    expect(annotationSchema.safeParse({ ...annotation, end: 10 }).success).toBe(false);
    const many = Array.from({ length: 101 }, () => annotation);
    expect(reviewPayloadSchema.safeParse({ slug: 'meu-post', annotations: many }).success).toBe(false);
    expect(reviewPayloadSchema.safeParse({ slug: 'meu-post', annotations: [] }).success).toBe(false);
  });
});
