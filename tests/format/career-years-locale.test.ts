import { describe, expect, it } from 'vitest';
import { careerYearsLabel, withCareerYears } from '../../src/lib/format/career-years';
import { messagesFor } from '../../src/lib/i18n/messages';

const at = new Date('2026-10-19T12:00:00Z');

describe('career years by locale', () => {
  it('keeps the pt-BR label', () => {
    expect(careerYearsLabel(at)).toBe('+15 anos');
    expect(withCareerYears('há {anos}', at)).toBe('há +15 anos');
  });

  it('writes the English label', () => {
    expect(careerYearsLabel(at, 'en')).toBe('15+ years');
    expect(withCareerYears('{anos} of work', at, 'en')).toBe('15+ years of work');
  });
});

describe('reading time label', () => {
  it('reads in both languages', () => {
    expect(messagesFor('pt-BR').posts.readingTime(7)).toBe('7 min de leitura');
    expect(messagesFor('en').posts.readingTime(7)).toBe('7 min read');
  });
});
