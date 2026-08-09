import { describe, expect, it } from 'vitest';
import { buildRss } from '../../src/lib/posts/rss';
import type { Post } from '../../src/content/schemas/post';

const site = new URL('https://nandomoreira.dev');

const posts: Post[] = [
  {
    slug: 'a',
    title: 'Title A & Co',
    summary: 'Summary with <angle> brackets',
    date: '2026-08-09',
    draft: false,
    archived: false,
  },
  {
    slug: 'b',
    title: 'Title B',
    summary: 'Older',
    date: '2026-01-01',
    draft: false,
    archived: true,
  },
];

describe('buildRss', () => {
  it('is well-formed XML with the expected envelope', () => {
    const xml = buildRss({ site, posts, title: 'Posts', description: 'Feed' });

    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('</rss>');
    expect(xml.match(/<item>/g)?.length).toBe(2);
  });

  it('escapes entities in title and summary', () => {
    const xml = buildRss({ site, posts, title: 'Posts', description: 'Feed' });

    expect(xml).toContain('Title A &amp; Co');
    expect(xml).toContain('&lt;angle&gt;');
    expect(xml).not.toContain('Title A & Co');
  });

  it('derives pubDate from the frontmatter date', () => {
    const xml = buildRss({ site, posts, title: 'Posts', description: 'Feed' });

    expect(xml).toContain('<pubDate>');
    expect(xml).toContain('2026');
  });

  it('links each item to its absolute root URL', () => {
    const xml = buildRss({ site, posts, title: 'Posts', description: 'Feed' });

    expect(xml).toContain('https://nandomoreira.dev/a');
    expect(xml).toContain('https://nandomoreira.dev/b');
    expect(xml).not.toContain('/notas/');
  });

  it('is valid with zero published posts', () => {
    const xml = buildRss({ site, posts: [], title: 'Posts', description: 'Feed' });

    expect(xml).toContain('<rss');
    expect(xml).toContain('</channel>');
    expect(xml).not.toContain('<item>');
  });
});
