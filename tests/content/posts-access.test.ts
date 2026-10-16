import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import {
  archivedOf,
  currentOf,
  groupArchiveYears,
  publishedPosts,
  getCurrentPosts,
  sortPosts,
} from '../../src/lib/content/posts';

const post = (overrides: Partial<Post> = {}): Post =>
  ({
    slug: 'a',
    title: 'A',
    summary: 's',
    date: '2026-01-01',
    draft: false,
    archived: false,
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

  it('orders by the full timestamp: year, month, day, hour, minute and second', () => {
    const result = sortPosts([
      post({ slug: 'morning', date: '2026-10-10', publishedAt: '2026-10-10T11:12:35-03:00' }),
      post({ slug: 'seconds-later', date: '2026-10-10', publishedAt: '2026-10-10T11:12:40-03:00' }),
      post({ slug: 'noon', date: '2026-10-10', publishedAt: '2026-10-10T12:08:11-03:00' }),
      post({ slug: 'yesterday-late', date: '2026-10-09', publishedAt: '2026-10-09T23:59:59-03:00' }),
      post({ slug: 'last-month', date: '2026-09-30', publishedAt: '2026-09-30T23:59:59-03:00' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual([
      'noon',
      'seconds-later',
      'morning',
      'yesterday-late',
      'last-month',
    ]);
  });

  it('places a post without a timestamp at the start of its day', () => {
    const result = sortPosts([
      post({ slug: 'day-only', date: '2026-10-10' }),
      post({ slug: 'timed', date: '2026-10-10', publishedAt: '2026-10-10T00:00:01-03:00' }),
      post({ slug: 'yesterday', date: '2026-10-09', publishedAt: '2026-10-09T23:00:00-03:00' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['timed', 'day-only', 'yesterday']);
  });

  it('lists the newest post first on the real posts page order', async () => {
    const [first, second, third] = await getCurrentPosts();
    expect(first.slug).toBe('de-cinco-dias-para-trinta-minutos');
    expect(second.slug).toBe('job-radar-radar-de-vagas-em-python-puro');
    expect(third.slug).toBe('analytics-sem-script-medindo-no-servidor-e-lendo-no-terminal');
  });
});

describe('posts access layer', () => {
  it('separates current from archived', () => {
    const posts = [
      post({ slug: 'now', archived: false }),
      post({ slug: 'old', archived: true, date: '2015-01-01' }),
      post({ slug: 'draft', draft: true, archived: false }),
    ];

    expect(currentOf(posts).every((p) => !p.archived)).toBe(true);
    expect(archivedOf(posts).every((p) => p.archived)).toBe(true);
    expect(currentOf(posts).map((p) => p.slug)).toEqual(['now']);
    expect(archivedOf(posts).map((p) => p.slug)).toEqual(['old']);
  });

  it('groups the archive by year, newest first', () => {
    const years = groupArchiveYears([
      post({ slug: 'a', archived: true, date: '2015-06-01' }),
      post({ slug: 'b', archived: true, date: '2017-01-01' }),
      post({ slug: 'c', archived: true, date: '2015-12-01' }),
      post({ slug: 'd', archived: false, date: '2024-01-01' }),
    ]);

    expect(years.map((y) => y.year)).toEqual([...years.map((y) => y.year)].sort().reverse());
    // A year with no post must not become a route (edge case in the spec).
    expect(years.every((y) => y.count > 0)).toBe(true);
    expect(years).toEqual([
      { year: '2017', count: 1 },
      { year: '2015', count: 2 },
    ]);
  });

  it('never returns a draft on any surface', () => {
    const posts = [
      post({ slug: 'live', draft: false }),
      post({ slug: 'hidden', draft: true }),
      post({ slug: 'old', draft: true, archived: true }),
    ];
    const all = [...currentOf(posts), ...archivedOf(posts)];
    expect(all.some((p) => p.draft)).toBe(false);
  });
});

describe('posts access barrel', () => {
  it('exports getAllPosts, getCurrentPosts and archive helpers', () => {
    expect(barrel).toContain('getAllPosts');
    expect(barrel).toContain('getPost');
    expect(barrel).toContain('getCurrentPosts');
    expect(barrel).toContain('getArchivedPosts');
    expect(barrel).toContain('getArchiveYears');
  });

  it('allows posts.ts to call getCollection under the single-source gate', () => {
    expect(allowlist).toContain('src/lib/content/posts.ts');
  });
});
