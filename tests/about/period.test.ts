import { describe, expect, it } from 'vitest';
import { careerStartYear, formatPeriod } from '../../src/lib/about/period';

describe('formatPeriod', () => {
  it('renders a closed period as month and year on both ends', () => {
    expect(formatPeriod('2022-04-01', '2024-06-30')).toBe('abr/2022 – jun/2024');
  });

  it('says the position is current when there is no end date, instead of leaving a blank', () => {
    expect(formatPeriod('2025-11-01')).toBe('nov/2025 – atual');
  });

  it('reads the calendar date, not a timezone-shifted instant', () => {
    // new Date('2025-11-01') is midnight UTC, which is still October in Brazil.
    expect(formatPeriod('2025-11-01', '2025-12-01')).toBe('nov/2025 – dez/2025');
  });
});

describe('careerStartYear', () => {
  it('returns the year of the earliest position, whatever the order', () => {
    expect(
      careerStartYear([
        { startDate: '2022-04-01' },
        { startDate: '2010-11-01' },
        { startDate: '2016-01-01' },
      ]),
    ).toBe(2010);
  });

  it('returns undefined when there is no history, so the page omits the claim', () => {
    expect(careerStartYear([])).toBeUndefined();
    expect(careerStartYear(undefined)).toBeUndefined();
  });
});
