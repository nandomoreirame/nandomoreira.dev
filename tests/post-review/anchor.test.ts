import { describe, expect, it } from 'vitest';
import { anchorFrom, sectionFor } from '../../src/lib/post-review/anchor';

const text = 'a'.repeat(40) + 'TRECHO' + 'b'.repeat(40);

describe('anchorFrom', () => {
  it('keeps the quote and 32 characters of context on each side', () => {
    const anchor = anchorFrom(text, 40, 46);
    expect(anchor).toEqual({ quote: 'TRECHO', prefix: 'a'.repeat(32), suffix: 'b'.repeat(32), start: 40, end: 46 });
  });

  it('cuts the context at the edges of the text', () => {
    expect(anchorFrom('abc TRECHO def', 4, 10)).toEqual({
      quote: 'TRECHO',
      prefix: 'abc ',
      suffix: ' def',
      start: 4,
      end: 10,
    });
  });

  it('trims whitespace the selection caught at either end', () => {
    expect(anchorFrom('abc  TRECHO\n def', 3, 13)).toEqual({
      quote: 'TRECHO',
      prefix: 'abc  ',
      suffix: '\n def',
      start: 5,
      end: 11,
    });
  });

  it('returns an empty quote for a whitespace-only selection', () => {
    expect(anchorFrom('a   b', 1, 4).quote).toBe('');
  });
});

describe('sectionFor', () => {
  const headings = [
    { offset: 100, text: 'Contexto' },
    { offset: 300, text: 'Solução' },
  ];

  it('is null before the first heading', () => {
    expect(sectionFor(headings, 50)).toBeNull();
  });

  it('is the last heading at or before the start', () => {
    expect(sectionFor(headings, 100)).toBe('Contexto');
    expect(sectionFor(headings, 299)).toBe('Contexto');
    expect(sectionFor(headings, 900)).toBe('Solução');
  });
});
