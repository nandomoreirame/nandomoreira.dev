import type { Locale } from '../i18n/locale';

/**
 * First professional year. The "+N anos" is computed when the page renders,
 * never typed, so it does not age (asked on 2026-10-18).
 */
export const CAREER_START_YEAR = 2011;

export const careerYears = (now: Date = new Date()): number => now.getUTCFullYear() - CAREER_START_YEAR;

export const careerYearsLabel = (now?: Date, locale: Locale = 'pt-BR'): string =>
  locale === 'en' ? `${careerYears(now)}+ years` : `+${careerYears(now)} anos`;

/** Replaces every {anos} marker in a text with the label. */
export const withCareerYears = (text: string, now?: Date, locale: Locale = 'pt-BR'): string =>
  text.replaceAll('{anos}', careerYearsLabel(now, locale));
