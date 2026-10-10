import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import {
  archivedOf,
  currentOf,
  draftsFirst,
  draftsOf,
  getUpcomingPosts,
  getCurrentPosts,
  publishedPosts,
  showDrafts,
} from '../../src/lib/content/posts';

const post = (overrides: Partial<Post> = {}): Post =>
  ({ slug: 'a', title: 'A', summary: 's', date: '2026-01-01', draft: false, archived: false, ...overrides }) as Post;

const posts = [
  post({ slug: 'live', date: '2026-02-01' }),
  post({ slug: 'draft-old', draft: true, date: '2026-01-01' }),
  post({ slug: 'draft-new', draft: true, date: '2026-03-01' }),
  post({ slug: 'archived-draft', draft: true, archived: true, date: '2015-01-01' }),
];

describe('showDrafts', () => {
  // Only `astro dev` serves drafts: the build is production, Vitest is test.
  it('shows drafts only on the local dev server', () => {
    expect(showDrafts({ DEV: true, MODE: 'development' })).toBe(true);
    expect(showDrafts({ DEV: false, MODE: 'production' })).toBe(false);
    expect(showDrafts({ DEV: true, MODE: 'test' })).toBe(false);
  });

  it('is off in this test run, so the suite sees what production sees', async () => {
    const slugs = (await getCurrentPosts()).map((item) => item.slug);
    expect(slugs).not.toContain('por-que-parenteses-no-tailwind');
  });
});

describe('including drafts', () => {
  it('keeps drafts out by default and lets dev opt in', () => {
    expect(publishedPosts(posts).map((item) => item.slug)).toEqual(['live']);
    expect(publishedPosts(posts, true)).toHaveLength(4);
  });

  it('lists a draft with the current or archived posts it belongs to when opted in', () => {
    expect(currentOf(posts, true).map((item) => item.slug)).toEqual(['live', 'draft-old', 'draft-new']);
    expect(archivedOf(posts, true).map((item) => item.slug)).toEqual(['archived-draft']);
    expect(currentOf(posts).map((item) => item.slug)).toEqual(['live']);
  });
});

describe('draftsFirst', () => {
  // In dev the drafts are the work in progress, so they open the list.
  it('lists drafts above published posts, keeping each group in its order', () => {
    const ordered = [
      post({ slug: 'live-new' }),
      post({ slug: 'draft-a', draft: true }),
      post({ slug: 'live-old' }),
      post({ slug: 'draft-b', draft: true }),
    ];

    expect(draftsFirst(ordered).map((item) => item.slug)).toEqual(['draft-a', 'draft-b', 'live-new', 'live-old']);
  });

  it('leaves a list without drafts untouched', () => {
    const ordered = [post({ slug: 'x' }), post({ slug: 'y' })];
    expect(draftsFirst(ordered).map((item) => item.slug)).toEqual(['x', 'y']);
  });
});

describe('upcoming posts', () => {
  it('are the current drafts, newest first', () => {
    expect(draftsOf(posts).map((item) => item.slug)).toEqual(['draft-new', 'draft-old']);
  });

  it('come from the real collection even outside dev, for the teaser', async () => {
    const slugs = (await getUpcomingPosts()).map((item) => item.slug);
    expect(slugs.length).toBeGreaterThan(0);
    for (const item of await getUpcomingPosts()) expect(item.draft).toBe(true);
  });

  it('are exported through the access layer barrel', () => {
    expect(readFileSync('src/lib/content/index.ts', 'utf8')).toContain('getUpcomingPosts');
  });
});
