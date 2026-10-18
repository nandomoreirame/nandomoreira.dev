import { describe, expect, it } from 'vitest';
import { CAREER_START_YEAR, careerYears, careerYearsLabel, withCareerYears } from '../../src/lib/format/career-years';

describe('career years', () => {
  it('counts from 2011', () => {
    expect(CAREER_START_YEAR).toBe(2011);
    expect(careerYears(new Date('2026-10-18T12:00:00Z'))).toBe(15);
    expect(careerYears(new Date('2027-01-01T00:00:00Z'))).toBe(16);
  });

  it('labels with a leading plus', () => {
    expect(careerYearsLabel(new Date('2026-10-18T12:00:00Z'))).toBe('+15 anos');
  });

  it('fills every {anos} marker and leaves other text alone', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    expect(withCareerYears('{anos} construindo software', now)).toBe('+15 anos construindo software');
    expect(withCareerYears('há {anos}, {anos}', now)).toBe('há +15 anos, +15 anos');
    expect(withCareerYears('sem marcador', now)).toBe('sem marcador');
  });
});
