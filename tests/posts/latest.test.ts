import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import { latestPosts } from '../../src/lib/posts/latest';

const post = (overrides: Partial<Post> & Pick<Post, 'slug' | 'date'>): Post => ({
  title: overrides.slug,
  summary: 'summary',
  markers: ['a', 'b', 'c'],
  draft: false,
  archived: false,
  ...overrides,
});

describe('latestPosts', () => {
  it('returns the newest current posts up to the limit', () => {
    const posts = [
      post({ slug: 'old', date: '2024-01-01' }),
      post({ slug: 'mid', date: '2025-06-01' }),
      post({ slug: 'new', date: '2026-01-01' }),
      post({ slug: 'newer', date: '2026-03-01' }),
      post({ slug: 'newest', date: '2026-08-01' }),
    ];

    expect(latestPosts(posts, 4).map(item => item.slug)).toEqual(['newest', 'newer', 'new', 'mid']);
  });

  it('excludes drafts even when they are newer', () => {
    const posts = [
      post({ slug: 'draft', date: '2026-09-01', draft: true }),
      post({ slug: 'live', date: '2026-01-01' }),
    ];

    expect(latestPosts(posts, 4).map(item => item.slug)).toEqual(['live']);
  });

  it('excludes archived posts', () => {
    const posts = [
      post({ slug: 'archived', date: '2026-09-01', archived: true }),
      post({ slug: 'live', date: '2026-01-01' }),
    ];

    expect(latestPosts(posts, 4).map(item => item.slug)).toEqual(['live']);
  });

  it('returns an empty list when there are no current published posts', () => {
    expect(latestPosts([], 4)).toEqual([]);
    expect(latestPosts([post({ slug: 'only-draft', date: '2026-01-01', draft: true })], 4)).toEqual([]);
  });

  it('defaults the limit to 4', () => {
    const posts = Array.from({ length: 6 }, (_, index) => post({ slug: `p${index}`, date: `2026-0${index + 1}-01` }));

    expect(latestPosts(posts)).toHaveLength(4);
  });
});
