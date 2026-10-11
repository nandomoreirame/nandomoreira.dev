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
