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
    expect(latest?.period).toMatch(/09\/2026/);
    expect(latest?.highlights.length).toBeGreaterThan(0);
  });

  it('carries no e-mail address, so the lead form stays the way to reach for the PDF', () => {
    expect(JSON.stringify(RESUME)).not.toMatch(/@/);
  });

  it('never uses em or en dashes in prose', () => {
    expect(JSON.stringify(RESUME)).not.toMatch(/[—–]/);
  });
});

/** Held to the PDF offered for download (the full-stack variant of the CV, since 2026-11-14). */
describe('RESUME parity with the PDF', () => {
  it('carries the full-stack title and every bullet of every job', () => {
    expect(RESUME.title).toBe('Senior Fullstack Software Engineer | React, Node.js, NestJS, TypeScript');
    const counts = Object.fromEntries(RESUME.experience.map(job => [job.company, job.highlights.length]));
    expect(counts).toEqual({
      'Liquid AI': 6,
      'Norte Marketing': 3,
      'Skyone Solutions': 3,
      'Itaú Unibanco': 3,
      'Risknow.ai': 3,
    });
    expect(RESUME.earlier).toHaveLength(8);
    expect(RESUME.projects).toHaveLength(4);
  });

  it('keeps the PDF wording, key technologies included', () => {
    const liquid = RESUME.experience[0];
    expect(liquid?.highlights[0]).toMatch(/^Desenvolvi de ponta a ponta o Play Manager/);
    expect(liquid?.keyTech).toMatch(/^TypeScript, React 19, Hono, Firebase/);
    expect(RESUME.stack.map(row => row.area)).toEqual(['Proficiente', 'Intermediário', 'Básico']);
    expect(RESUME.stack[2]?.items).toBe('Java (Spring Boot)');
    expect(JSON.stringify(RESUME.projects)).toContain('Plugins para o Noctalia Shell');
  });

  it('opens with the PDF summary, whose career count comes from the clock', () => {
    const summary = summaryOf(15);
    expect(summary).toMatch(
      /^Senior Fullstack Software Engineer com mais de 15 anos de experiência, do banco de dados à interface:/,
    );
    expect(summary).toContain('Antes, Itaú Unibanco, Skyone, Risknow.ai e Pipefy.');
    expect(summaryOf(16)).toContain('mais de 16 anos');
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
    expect(en.title).toBe(RESUME.title);
    expect(en.experience.every(job => job.keyTech)).toBe(true);
  });

  it('opens with the English PDF summary, whose career count comes from the clock', () => {
    expect(summaryOf(15, 'en')).toMatch(
      /^Senior Fullstack Software Engineer with 15\+ years of experience, from the database to the interface:/,
    );
    expect(summaryOf(15, 'en')).toContain('Before that: Itaú Unibanco, Skyone, Risknow.ai and Pipefy.');
    expect(summaryOf(16, 'en')).toContain('with 16+ years');
    expect(summaryOf(15, 'en')).not.toContain('Engenheiro');
  });

  it('never uses em or en dashes in English prose', () => {
    expect(JSON.stringify(resumeFor('en'))).not.toMatch(/[—–]/);
    expect(summaryOf(15, 'en')).not.toMatch(/[—–]/);
  });
});
