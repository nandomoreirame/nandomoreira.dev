import { describe, expect, it } from 'vitest';
import { jsonLdForPost, serialiseJsonLd } from '../../src/lib/posts/post-ld';
import type { Post } from '../../src/content/schemas/post';

const post: Post = {
  slug: 'por-que-parenteses-no-tailwind',
  title: 'Por que parênteses no Tailwind 4',
  summary: 'Colchetes geram CSS inválido.',
  date: '2026-08-09',
  markers: ['css', 'front-end', 'tailwind'],
  draft: false,
  archived: false,
};

const site = 'https://nandomoreira.dev';

describe('jsonLdForPost', () => {
  it('declares the schema.org context and a short-form text type', () => {
    const ld = jsonLdForPost(post, site);

    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toMatch(/Article|BlogPosting|TechArticle|CreativeWork/);
  });

  it('points at the canonical root URL', () => {
    expect(jsonLdForPost(post, site).url).toBe(
      'https://nandomoreira.dev/por-que-parenteses-no-tailwind',
    );
  });

  it('declares datePublished so machines see the same date as humans', () => {
    const ld = jsonLdForPost(post, site);

    expect(ld.datePublished).toBe('2026-08-09');
  });

  it('serialises through serialiseJsonLd, escaping angle brackets', () => {
    const ld = jsonLdForPost(
      { ...post, summary: 'Uses <script> tags carefully' },
      site,
    );
    const output = serialiseJsonLd(ld);

    expect(output).toContain('\\u003c');
    expect(output).not.toContain('<script>');
  });
});

describe('jsonLdForPost authorship', () => {
  const author = { name: 'Fernando Moreira Costa' };

  it('names the author and the publisher as the Person of the home page', () => {
    const ld = jsonLdForPost(post, site, author);
    expect(ld.author).toEqual({ '@type': 'Person', '@id': 'https://nandomoreira.dev/#person', name: author.name, url: 'https://nandomoreira.dev/' });
    expect(ld.publisher).toEqual(ld.author);
  });

  it('carries the share card, the language, the page and both dates', () => {
    const ld = jsonLdForPost(post, site, author);
    expect(ld.image).toBe('https://nandomoreira.dev/og/por-que-parenteses-no-tailwind.png');
    expect(ld.inLanguage).toBe('pt-BR');
    expect(ld.mainEntityOfPage).toBe('https://nandomoreira.dev/por-que-parenteses-no-tailwind');
    expect(ld.dateModified).toBe(post.date);
  });

  it('prefers publishedAt for both dates when the post has a timestamp', () => {
    const ld = jsonLdForPost({ ...post, publishedAt: '2026-08-09T10:00:00-03:00' }, site, author);
    expect(ld.datePublished).toBe('2026-08-09T10:00:00-03:00');
    expect(ld.dateModified).toBe('2026-08-09T10:00:00-03:00');
  });
});
