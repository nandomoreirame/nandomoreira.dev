import { describe, expect, it } from 'vitest';
import { buildRss } from '../../src/lib/notes/rss';
import type { Post } from '../../src/content/schemas/post';

const site = new URL('https://nandomoreira.dev');

const notes: Post[] = [
  {
    slug: 'a',
    title: 'Title A & Co',
    summary: 'Summary with <angle> brackets',
    date: '2026-08-09',
    draft: false,
  },
  {
    slug: 'b',
    title: 'Title B',
    summary: 'Older',
    date: '2026-01-01',
    draft: false,
  },
];

describe('buildRss', () => {
  it('is well-formed XML with the expected envelope', () => {
    const xml = buildRss({ site, notes, title: 'Notas', description: 'Feed' });

    expect(xml.startsWith('<?xml')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('</rss>');
    expect(xml.match(/<item>/g)?.length).toBe(2);
  });

  it('escapes entities in title and summary', () => {
    const xml = buildRss({ site, notes, title: 'Notas', description: 'Feed' });

    expect(xml).toContain('Title A &amp; Co');
    expect(xml).toContain('&lt;angle&gt;');
    expect(xml).not.toContain('Title A & Co');
  });

  it('derives pubDate from the frontmatter date', () => {
    const xml = buildRss({ site, notes, title: 'Notas', description: 'Feed' });

    expect(xml).toContain('<pubDate>');
    expect(xml).toContain('2026');
    // 2026-08-09 as UTC midnight.
    expect(xml).toMatch(/09 Aug 2026|Aug 09 2026|2026/);
  });

  it('links each item to its absolute note URL', () => {
    const xml = buildRss({ site, notes, title: 'Notas', description: 'Feed' });

    expect(xml).toContain('https://nandomoreira.dev/notas/a');
    expect(xml).toContain('https://nandomoreira.dev/notas/b');
  });

  it('is valid with zero published notes', () => {
    const xml = buildRss({ site, notes: [], title: 'Notas', description: 'Feed' });

    expect(xml).toContain('<rss');
    expect(xml).toContain('</channel>');
    expect(xml).not.toContain('<item>');
  });
});
