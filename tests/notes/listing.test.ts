import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/pages/notas/index.astro', 'utf8');

describe('/notas listing', () => {
  it('uses ListRow without a stamp, so the date column collapses', () => {
    expect(source).toContain('ListRow');
    expect(source).not.toContain('stamp=');
    expect(source).not.toContain('toCompactStamp');
  });

  it('reads notes through the access layer', () => {
    expect(source).toContain('getAllNotes');
    expect(source).not.toContain('getCollection(');
  });

  it('shows the count on the section header', () => {
    expect(source).toContain('count=');
    expect(source).toContain('SectionHeader');
  });

  it('handles the empty catalogue with an explicit state', () => {
    expect(source).toMatch(/nenhuma nota|ainda/i);
  });
});
