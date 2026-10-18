/**
 * First professional year. The "+N anos" is computed when the page renders,
 * never typed, so it does not age (asked on 2026-10-18).
 */
export const CAREER_START_YEAR = 2011;

export const careerYears = (now: Date = new Date()): number => now.getUTCFullYear() - CAREER_START_YEAR;

export const careerYearsLabel = (now?: Date): string => `+${careerYears(now)} anos`;

/** Replaces every {anos} marker in a text with the label. */
export const withCareerYears = (text: string, now?: Date): string =>
  text.replaceAll('{anos}', careerYearsLabel(now));
