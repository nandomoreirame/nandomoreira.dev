import { describe, expect, it } from 'vitest';
import { projectSchema } from '../../src/content/schemas/project';

const base = {
  slug: 'projeto',
  title: 'Projeto',
  block: 'professional',
  summary: 'resumo',
  problem: 'problema',
  decisions: 'decisões',
  outcome: 'resultado',
  tech: ['TypeScript'],
  featured: false,
  confidential: false,
  date: '2026-01-15',
};

describe('link integrity', () => {
  it('accepts a public repo with no live version', () => {
    const result = projectSchema.safeParse({
      ...base,
      repoUrl: 'https://github.com/x/y',
      liveUrl: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts a private repo with a live version', () => {
    const result = projectSchema.safeParse({
      ...base,
      repoUrl: null,
      liveUrl: 'https://bragstack.app',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a case with neither link, which has no verifiable evidence', () => {
    const result = projectSchema.safeParse({ ...base, repoUrl: null, liveUrl: null });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/repoUrl|liveUrl/);
    }
  });

  it('rejects a case where both links are simply absent', () => {
    expect(projectSchema.safeParse(base).success).toBe(false);
  });
});
