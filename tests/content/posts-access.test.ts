import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import { publishedPosts, sortPosts } from '../../src/lib/content/posts';

const post = (overrides: Partial<Post> = {}): Post =>
  ({
    slug: 'a',
    title: 'A',
    summary: 's',
    date: '2026-01-01',
    draft: false,
    ...overrides,
  }) as Post;

const barrel = readFileSync('src/lib/content/index.ts', 'utf8');
const allowlist = readFileSync('tests/content/single-source.test.ts', 'utf8');

describe('publishedPosts', () => {
  it('removes drafts from every public query', () => {
    const result = publishedPosts([
      post({ slug: 'public', draft: false }),
      post({ slug: 'hidden', draft: true }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['public']);
  });

  it('treats an explicit false as published', () => {
    expect(publishedPosts([post({ draft: false })])).toHaveLength(1);
  });
});

describe('sortPosts', () => {
  it('orders by date descending', () => {
    const result = sortPosts([
      post({ slug: 'old', date: '2025-01-01' }),
      post({ slug: 'new', date: '2026-08-09' }),
      post({ slug: 'mid', date: '2026-01-15' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['new', 'mid', 'old']);
  });

  it('is stable for equal dates', () => {
    const result = sortPosts([
      post({ slug: 'first', date: '2026-01-01', title: 'First' }),
      post({ slug: 'second', date: '2026-01-01', title: 'Second' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['first', 'second']);
  });
});

describe('posts access barrel', () => {
  it('exports getAllPosts and getPost', () => {
    expect(barrel).toContain('getAllPosts');
    expect(barrel).toContain('getPost');
  });

  it('allows posts.ts to call getCollection under the single-source gate', () => {
    expect(allowlist).toContain('src/lib/content/posts.ts');
  });
});
