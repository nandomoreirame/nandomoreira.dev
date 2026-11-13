import { describe, expect, it } from 'vitest';
import { buildRss } from '../../src/lib/posts/rss';

const post = { slug: 'the-false-green', title: 'The false green', summary: 'S', date: '2026-10-09', markers: ['a', 'b', 'c'] };

describe('English RSS', () => {
  it('declares English and links the /en posts', () => {
    const xml = buildRss({ site: new URL('https://nandomoreira.dev'), posts: [post as never], title: 'T', description: 'D', locale: 'en' });
    expect(xml).toContain('<language>en</language>');
    expect(xml).toContain('<link>https://nandomoreira.dev/en/the-false-green</link>');
    expect(xml).toContain('<link>https://nandomoreira.dev/en/posts</link>');
  });

  it('keeps the pt-BR feed as it is', () => {
    const xml = buildRss({ site: new URL('https://nandomoreira.dev'), posts: [], title: 'T', description: 'D' });
    expect(xml).toContain('<language>pt-BR</language>');
  });
});
