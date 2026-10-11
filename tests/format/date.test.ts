import { describe, expect, it } from 'vitest';
import { toCompactStamp, toLongDate } from '../../src/lib/format/date';

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
