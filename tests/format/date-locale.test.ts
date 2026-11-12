import { describe, expect, it } from 'vitest';
import { toLongDate, toShortDate } from '../../src/lib/format/date';

describe('dates by locale', () => {
  it('keeps pt-BR as the default', () => {
    expect(toLongDate('2026-10-11')).toBe('11 de outubro de 2026');
    expect(toShortDate('2026-10-16')).toBe('16 out. 2026');
  });

  it('formats English', () => {
    expect(toLongDate('2026-10-11', 'en')).toBe('October 11, 2026');
    expect(toShortDate('2026-10-16', 'en')).toBe('16 Oct 2026');
    expect(toShortDate('2026-05-01', 'en')).toBe('01 May 2026');
  });

  it('never moves the day across a timezone', () => {
    expect(toLongDate('2026-01-01', 'en')).toBe('January 1, 2026');
  });
});
