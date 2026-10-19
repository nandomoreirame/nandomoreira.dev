import { describe, expect, it } from 'vitest';
import {
  assertUniqueProjectMarkdownSlugs,
  assertUniqueSlugs,
  extractSlugFromMarkdown,
} from '../../src/lib/content/validate';

describe('assertUniqueSlugs', () => {
  it('accepts distinct slugs', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a' }, { slug: 'b' }])).not.toThrow();
  });

  it('rejects a duplicate, which would make /projetos/<slug> ambiguous', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a' }, { slug: 'a' }])).toThrow(/a/);
  });

  it('names every duplicate, not just the first', () => {
    expect(() => assertUniqueSlugs([{ slug: 'a' }, { slug: 'a' }, { slug: 'b' }, { slug: 'b' }])).toThrow(/a.*b|b.*a/);
  });

  it('accepts an empty catalogue', () => {
    expect(() => assertUniqueSlugs([])).not.toThrow();
  });
});

describe('extractSlugFromMarkdown', () => {
  it('reads the frontmatter slug', () => {
    expect(extractSlugFromMarkdown('---\nslug: forja\ntitle: Forja\n---\n')).toBe('forja');
  });

  it('returns undefined when slug is absent', () => {
    expect(extractSlugFromMarkdown('---\ntitle: Forja\n---\n')).toBeUndefined();
  });
});

describe('assertUniqueProjectMarkdownSlugs', () => {
  it('accepts two files with distinct slugs', () => {
    expect(() =>
      assertUniqueProjectMarkdownSlugs([
        { path: 'a.md', source: '---\nslug: a\n---\n' },
        { path: 'b.md', source: '---\nslug: b\n---\n' },
      ]),
    ).not.toThrow();
  });

  it('rejects two files that declare the same slug', () => {
    expect(() =>
      assertUniqueProjectMarkdownSlugs([
        { path: 'forja.md', source: '---\nslug: forja\n---\n' },
        { path: 'forja-copy.md', source: '---\nslug: forja\n---\n' },
      ]),
    ).toThrow(/forja/);
  });
});
