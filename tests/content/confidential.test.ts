import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { redactConfidential } from '../../src/lib/content/confidential';

const base = {
  slug: 'cliente-x',
  title: 'Plataforma da Acme',
  block: 'professional',
  summary: 'Plataforma interna para a Acme',
  problem: 'A Acme perdia 4h por semana em conciliação manual.',
  decisions: 'Fila assíncrona em vez de processamento síncrono.',
  outcome: 'Redução de 4h para 20min, com faturamento de R$ 2,3M no primeiro ano.',
  tech: ['TypeScript'],
  repoUrl: null,
  liveUrl: 'https://example.com',
  featured: false,
  clientName: 'Acme',
  confidentialMetrics: ['R$ 2,3M no primeiro ano'],
} as unknown as Project;

const publicText = (project: Project): string =>
  [
    project.title,
    project.summary,
    project.problem,
    project.decisions,
    project.outcome,
    ...(project.images?.map((image) => image.alt) ?? []),
  ].join('\n');

describe('redactConfidential', () => {
  it('leaves a public project untouched', () => {
    const project = { ...base, confidential: false };
    expect(redactConfidential(project)).toEqual(project);
  });

  it('removes the client name when the case is confidential', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(publicText(redacted).toLowerCase()).not.toContain('acme');
  });

  it('strips the client name case-insensitively from prose', () => {
    const redacted = redactConfidential({
      ...base,
      confidential: true,
      summary: 'Feito para a ACME e para a acme holding',
    });
    expect(redacted.summary.toLowerCase()).not.toContain('acme');
  });

  it('redacts images alt text, which is visible and indexable content', () => {
    const redacted = redactConfidential({
      ...base,
      confidential: true,
      images: [{ src: '/img/dash.png', alt: 'Dashboard da Acme em producao' }],
    });
    expect(redacted.images?.[0]?.alt.toLowerCase()).not.toContain('acme');
  });

  it('removes the sensitive metric from the outcome', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(redacted.outcome).not.toContain('R$ 2,3M');
  });

  it('keeps the case publishable: problem and decisions survive', () => {
    const redacted = redactConfidential({ ...base, confidential: true });
    expect(redacted.problem).toContain('conciliação manual');
    expect(redacted.decisions).toContain('Fila assíncrona');
  });

  it('never mutates the input', () => {
    const project = { ...base, confidential: true };
    const snapshot = JSON.stringify(project);
    redactConfidential(project);
    expect(JSON.stringify(project)).toBe(snapshot);
  });
});
