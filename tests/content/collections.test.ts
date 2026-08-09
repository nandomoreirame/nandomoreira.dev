import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  assertUniqueMarkdownSlugs,
  assertUniqueProjectMarkdownSlugs,
} from '../../src/lib/content/validate';

const config = readFileSync('src/content.config.ts', 'utf8');

describe('content collections', () => {
  it('declares projects, notes and profile', () => {
    expect(config).toContain('projects');
    expect(config).toContain('notes');
    expect(config).toContain('profile');
  });

  it('reuses the tested schemas instead of redeclaring them inline', () => {
    expect(config).toContain("from './content/schemas/project'");
    expect(config).toContain("from './content/schemas/profile'");
    expect(config).toContain("from './content/schemas/note'");
  });
});

describe('assertUniqueMarkdownSlugs for notes', () => {
  it('accepts two notes with distinct slugs', () => {
    expect(() =>
      assertUniqueMarkdownSlugs(
        [
          { path: 'a.md', source: '---\nslug: a\n---\n' },
          { path: 'b.md', source: '---\nslug: b\n---\n' },
        ],
        'note',
      ),
    ).not.toThrow();
  });

  it('rejects two notes that declare the same slug', () => {
    expect(() =>
      assertUniqueMarkdownSlugs(
        [
          { path: 'a.md', source: '---\nslug: same\n---\n' },
          { path: 'b.md', source: '---\nslug: same\n---\n' },
        ],
        'note',
      ),
    ).toThrow(/same/);
  });

  it('keeps the project-named helper working for existing callers', () => {
    expect(() =>
      assertUniqueProjectMarkdownSlugs([
        { path: 'a.md', source: '---\nslug: a\n---\n' },
        { path: 'b.md', source: '---\nslug: b\n---\n' },
      ]),
    ).not.toThrow();
  });
});
