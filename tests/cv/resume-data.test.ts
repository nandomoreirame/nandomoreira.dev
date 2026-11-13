import { describe, expect, it } from 'vitest';
import { CAREER_START_YEAR, RESUME, careerYears, resumeFor, summaryOf } from '../../src/lib/cv/resume';

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

/** Held to the PDF offered for download (the AI Engineer variant of the CV). */
describe('RESUME parity with the PDF', () => {
  it('keeps every bullet of every job, not a digest', () => {
    const counts = Object.fromEntries(RESUME.experience.map(job => [job.company, job.highlights.length]));

    expect(counts).toEqual({
      'Liquid AI': 11,
      'Norte Marketing': 5,
      'Skyone Solutions': 4,
      'Itaú Unibanco': 4,
      'Risknow.ai': 3,
    });
    expect(RESUME.earlier).toHaveLength(5);
    expect(RESUME.projects).toHaveLength(4);
  });

  it('keeps the bullets a digest used to drop', () => {
    const liquid = RESUME.experience[0]?.highlights.join('\n') ?? '';

    for (const phrase of [
      'Levei a automação para dentro do produto',
      'Conduzi a virada da operação',
      'Blindei esse fluxo',
      'Orquestrei três CLIs de IA',
    ]) {
      expect(liquid).toContain(phrase);
    }
    expect(RESUME.experience[1]?.highlights.join('\n')).toContain('Scrum adaptado');
    expect(JSON.stringify(RESUME.projects)).toContain('11 estrelas');
  });

  it('opens with the summary, whose career count comes from the clock', () => {
    const summary = summaryOf(15);

    expect(summary).toMatch(/^Engenheiro de software com 15 anos de carreira, atuando de dados a interface\./);
    expect(summary).toContain('Mantenedor open source desde 2012.');
    expect(summaryOf(16)).toContain('com 16 anos de carreira');
  });
});

describe('English resume data', () => {
  it('keeps the same shape as the Portuguese sheet', () => {
    const en = resumeFor('en');
    expect(en.experience.map(job => [job.company, job.highlights.length])).toEqual(
      RESUME.experience.map(job => [job.company, job.highlights.length]),
    );
    expect(en.earlier).toHaveLength(RESUME.earlier.length);
    expect(en.projects).toHaveLength(RESUME.projects.length);
    expect(en.stack).toHaveLength(RESUME.stack.length);
    expect(en.education).toHaveLength(RESUME.education.length);
  });

  it('opens with an English summary whose career count comes from the clock', () => {
    expect(summaryOf(15, 'en')).toMatch(/^Software engineer with 15 years of career, from data to interface\./);
    expect(summaryOf(15, 'en')).toContain('Open source maintainer since 2012.');
    expect(summaryOf(16, 'en')).toContain('with 16 years of career');
    expect(summaryOf(15, 'en')).not.toContain('Engenheiro');
  });

  it('never uses em or en dashes in English prose', () => {
    expect(JSON.stringify(resumeFor('en'))).not.toMatch(/[—–]/);
    expect(summaryOf(15, 'en')).not.toMatch(/[—–]/);
  });
});
