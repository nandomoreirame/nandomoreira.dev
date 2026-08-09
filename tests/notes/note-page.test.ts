import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/pages/notas/[slug].astro', 'utf8');

describe('/notas/[slug]', () => {
  it('derives getStaticPaths from the access layer', () => {
    expect(source).toContain('getStaticPaths');
    expect(source).toContain('getAllNoteEntries');
    expect(source).not.toContain('getCollection(');
  });

  it('renders the body inside Prose', () => {
    expect(source).toContain('Prose');
    expect(source).toContain('render');
  });

  it('links back to the listing', () => {
    expect(source).toContain('href="/notas"');
  });

  it('never surfaces the ordering date', () => {
    expect(source).not.toContain('toCompactStamp');
    expect(source).not.toContain('<time');
    expect(source).not.toMatch(/\{[^}]*\.date[^}]*\}/);
  });
});
