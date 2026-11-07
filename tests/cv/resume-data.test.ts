import { describe, expect, it } from 'vitest';
import { CAREER_START_YEAR, RESUME, careerYears } from '../../src/lib/cv/resume';

describe('careerYears', () => {
  it('counts from 2011 and moves with the clock, never a typed number', () => {
    expect(CAREER_START_YEAR).toBe(2011);
    expect(careerYears(new Date('2026-11-06T12:00:00Z'))).toBe(15);
    expect(careerYears(new Date('2027-01-02T12:00:00Z'))).toBe(16);
  });
});

describe('RESUME', () => {
  it('lists Liquid AI first, in the past tense, with an end date', () => {
    const [latest] = RESUME.experience;
    expect(latest?.company).toBe('Liquid AI');
    expect(latest?.period).toMatch(/set\/2026/);
    expect(latest?.highlights.length).toBeGreaterThan(0);
  });

  it('carries no e-mail address, so the lead form stays the way to reach for the PDF', () => {
    expect(JSON.stringify(RESUME)).not.toMatch(/@/);
  });

  it('never uses em or en dashes in prose', () => {
    expect(JSON.stringify(RESUME)).not.toMatch(/[—–]/);
  });
});
