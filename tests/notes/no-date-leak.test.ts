import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';

const FORBIDDEN: Array<[string, RegExp]> = [
  ['ISO date', /2026-08-09/],
  ['slashed date', /09\/08\/2026|08\/09\/2026/],
  ['compact stamp', /\b08\/2026\b/],
  ['long form', /9 de agosto|agosto de 2026/i],
  ['time element', /<time\b/],
];

const listingSource = () => readFileSync('src/pages/notas/index.astro', 'utf8');
const pageSource = () => readFileSync('src/pages/notas/[slug].astro', 'utf8');

describe('no-date-leak gate (regex self-check)', () => {
  it('proves the expressions actually match the forbidden shapes', () => {
    expect('2026-08-09').toMatch(FORBIDDEN[0][1]);
    expect('09/08/2026').toMatch(FORBIDDEN[1][1]);
    expect('08/2026').toMatch(FORBIDDEN[2][1]);
    expect('9 de agosto de 2026').toMatch(FORBIDDEN[3][1]);
    expect('<time datetime="2026-08-09">').toMatch(FORBIDDEN[4][1]);
  });
});

describe('notes human surfaces never leak the ordering date', () => {
  it('listing source does not pass stamp or render a time element', () => {
    const source = listingSource();

    expect(source).not.toContain('stamp=');
    expect(source).not.toContain('toCompactStamp');
    expect(source).not.toContain('<time');
    expect(source).not.toContain('note.date');
  });

  it('note page source does not render the date', () => {
    const source = pageSource();

    expect(source).not.toContain('toCompactStamp');
    expect(source).not.toContain('<time');
    expect(source).not.toMatch(/\{[^}]*date[^}]*\}/);
  });

  it('rendered listing HTML contains none of the forbidden date formats', async () => {
    const NotasIndex = (await import('../../src/pages/notas/index.astro')).default;
    const container = await AstroContainer.create();
    const html = await container.renderToString(NotasIndex);

    for (const [label, pattern] of FORBIDDEN) {
      expect(html, label).not.toMatch(pattern);
    }
  });
});
