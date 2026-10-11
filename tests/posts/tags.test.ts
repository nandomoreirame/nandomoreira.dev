import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toHashtag } from '../../src/lib/posts/tags';

const POSTS_DIR = 'src/content/posts';

const markersOf = (file: string): string[] => {
  const frontmatter = readFileSync(join(POSTS_DIR, file), 'utf8').split('---')[1] ?? '';
  const block = frontmatter.match(/^markers:\n((?:\s+-.*\n?)+)/m)?.[1] ?? '';
  return [...block.matchAll(/^\s+-\s*(.+)$/gm)].map((m) => m[1]!.trim());
};

describe('toHashtag', () => {
  it('prefixes a marker with #', () => {
    expect(toHashtag('linux')).toBe('#linux');
  });

  it('joins the words of a multi-word marker with a hyphen, so it reads as one tag', () => {
    expect(toHashtag('open source')).toBe('#open-source');
    expect(toHashtag('  Claude  Code ')).toBe('#claude-code');
  });
});

describe('post markers', () => {
  // Each marker becomes a tag, and soon a search and grouping key: a whole
  // list squeezed into one string ("['sass', 'css']") would become one bogus tag.
  it('lists one plain tag per item, never a serialised list', () => {
    const offenders = readdirSync(POSTS_DIR)
      .filter((file) => file.endsWith('.md'))
      .flatMap((file) => markersOf(file).filter((m) => /[[\]'"]/.test(m)).map((m) => `${file}: ${m}`));
    expect(offenders).toEqual([]);
  });
});
