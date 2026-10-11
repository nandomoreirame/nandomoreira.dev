import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import { relatedPosts } from '../../src/lib/posts/related';

const post = (slug: string, overrides: Partial<Post> = {}): Post => ({
  slug,
  title: slug,
  summary: slug,
  date: '2026-01-01',
  markers: [],
  draft: false,
  archived: false,
  ...overrides,
});

const slugs = (posts: Post[]) => posts.map((p) => p.slug);

describe('relatedPosts', () => {
  it('never includes the post itself and returns at most the limit', () => {
    const all = ['a', 'b', 'c', 'd', 'e'].map((s) => post(s));
    const related = relatedPosts(all[0], all);

    expect(related).toHaveLength(3);
    expect(slugs(related)).not.toContain('a');
  });

  it('returns fewer when there are not enough other posts', () => {
    const all = [post('a'), post('b')];
    expect(slugs(relatedPosts(all[0], all))).toEqual(['b']);
  });

  it('ranks posts sharing markers first', () => {
    const current = post('gulp-4', { markers: ['gulp', 'node'] });
    const all = [
      current,
      post('jekyll', { markers: ['jekyll'] }),
      post('comece-gulp', { markers: ['gulp', 'javascript'] }),
      post('sass', { markers: ['sass'] }),
    ];

    expect(relatedPosts(current, all)[0].slug).toBe('comece-gulp');
  });

  it('ranks posts sharing significant title words, ignoring accents and case', () => {
    const current = post('skills', { title: 'Por que usar Skills no Claude Code' });
    const all = [
      current,
      post('notion', { title: 'Site completo com o Notion' }),
      post('project', { title: 'Como criar um CLAUDE Project produtivo' }),
      post('futuro', { title: 'O futuro do desenvolvimento web' }),
    ];

    expect(relatedPosts(current, all)[0].slug).toBe('project');
  });

  it('prefers posts from the same pool, current or archived', () => {
    const current = post('now', { markers: ['gulp'] });
    const all = [
      current,
      post('old-gulp', { archived: true, markers: ['gulp'], date: '2016-01-01' }),
      post('recent-1', { date: '2025-01-01' }),
      post('recent-2', { date: '2025-02-01' }),
      post('recent-3', { date: '2025-03-01' }),
    ];

    expect(slugs(relatedPosts(current, all))).not.toContain('old-gulp');
  });

  it('breaks ties by the closest date', () => {
    const current = post('mid', { date: '2026-02-01' });
    const all = [
      current,
      post('far', { date: '2024-01-01' }),
      post('near', { date: '2026-01-25' }),
      post('close', { date: '2026-03-01' }),
      post('farther', { date: '2020-01-01' }),
    ];

    expect(slugs(relatedPosts(current, all))).toEqual(['near', 'close', 'far']);
  });

  it('skips drafts', () => {
    const current = post('a');
    const all = [current, post('draft', { draft: true }), post('b')];

    expect(slugs(relatedPosts(current, all))).toEqual(['b']);
  });
});
