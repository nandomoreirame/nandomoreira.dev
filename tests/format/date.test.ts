import { describe, expect, it } from 'vitest';
import { toCompactStamp, toLongDate, toShortDate } from '../../src/lib/format/date';

describe('toCompactStamp', () => {
  it('renders an ISO date as MM/YYYY', () => {
    expect(toCompactStamp('2026-04-01')).toBe('04/2026');
  });

  it('pads a single-digit month', () => {
    expect(toCompactStamp('2025-06-09')).toBe('06/2025');
  });

  it('never shifts the month because of a timezone', () => {
    // Parsing '2026-01-01' as UTC and formatting in a negative offset would
    // yield 12/2025. The function must read the string, not build a Date.
    expect(toCompactStamp('2026-01-01')).toBe('01/2026');
  });

  it('rejects a malformed date instead of rendering NaN', () => {
    expect(() => toCompactStamp('01/2026')).toThrow();
  });
});

describe('toLongDate', () => {
  it('spells the date out in pt-BR', () => {
    expect(toLongDate('2026-10-11')).toBe('11 de outubro de 2026');
  });

  it('keeps the first day of the year in that year, whatever the timezone', () => {
    expect(toLongDate('2026-01-01')).toBe('1 de janeiro de 2026');
  });

  it('rejects anything that is not a calendar date', () => {
    expect(() => toLongDate('11/10/2026')).toThrow(/ISO-8601/);
  });
});

describe('toShortDate', () => {
  it('reads in pt-BR order: day, abbreviated month, year', () => {
    expect(toShortDate('2026-10-16')).toBe('16 out. 2026');
  });

  it('pads the day, so every stamp has the same width in mono', () => {
    expect(toShortDate('2026-05-03')).toBe('03 mai. 2026');
  });

  it('names every month', () => {
    const months = Array.from(
      { length: 12 },
      (_, index) => toShortDate(`2026-${String(index + 1).padStart(2, '0')}-01`).split(' ')[1],
    );
    expect(months).toEqual([
      'jan.',
      'fev.',
      'mar.',
      'abr.',
      'mai.',
      'jun.',
      'jul.',
      'ago.',
      'set.',
      'out.',
      'nov.',
      'dez.',
    ]);
  });

  it('keeps the first day of the year in that year, whatever the timezone', () => {
    expect(toShortDate('2026-01-01')).toBe('01 jan. 2026');
  });

  it('rejects a malformed date', () => {
    expect(() => toShortDate('16/10/2026')).toThrow();
  });
});
