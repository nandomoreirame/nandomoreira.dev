import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Note } from '../../src/content/schemas/note';
import { publishedNotes, sortNotes } from '../../src/lib/content/notes';

const note = (overrides: Partial<Note> = {}): Note =>
  ({
    slug: 'a',
    title: 'A',
    summary: 's',
    date: '2026-01-01',
    draft: false,
    ...overrides,
  }) as Note;

const barrel = readFileSync('src/lib/content/index.ts', 'utf8');
const allowlist = readFileSync('tests/content/single-source.test.ts', 'utf8');

describe('publishedNotes', () => {
  it('removes drafts from every public query', () => {
    const result = publishedNotes([
      note({ slug: 'public', draft: false }),
      note({ slug: 'hidden', draft: true }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['public']);
  });

  it('treats an explicit false as published', () => {
    expect(publishedNotes([note({ draft: false })])).toHaveLength(1);
  });
});

describe('sortNotes', () => {
  it('orders by date descending', () => {
    const result = sortNotes([
      note({ slug: 'old', date: '2025-01-01' }),
      note({ slug: 'new', date: '2026-08-09' }),
      note({ slug: 'mid', date: '2026-01-15' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['new', 'mid', 'old']);
  });

  it('is stable for equal dates', () => {
    const result = sortNotes([
      note({ slug: 'first', date: '2026-01-01', title: 'First' }),
      note({ slug: 'second', date: '2026-01-01', title: 'Second' }),
    ]);

    expect(result.map((item) => item.slug)).toEqual(['first', 'second']);
  });
});

describe('notes access barrel', () => {
  it('exports getAllNotes and getNote', () => {
    expect(barrel).toContain('getAllNotes');
    expect(barrel).toContain('getNote');
  });

  it('allows notes.ts to call getCollection under the single-source gate', () => {
    expect(allowlist).toContain('src/lib/content/notes.ts');
  });
});
