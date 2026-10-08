import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { buildCaseMarkdown } from '../../src/lib/aeo/case-markdown';

const site = new URL('https://nandomoreira.dev');

const project = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Multi-CLI GUI client for coding agents',
  problem: 'Three terminals, one context loss.',
  decisions: 'Tauri and Rust for a small binary.',
  outcome: 'Daily driver for agent work.',
  block: 'ai-tooling',
  tech: ['Rust', 'Tauri'],
  date: '2026-05-01',
  repoUrl: 'https://github.com/nandomoreirame/forja',
  liveUrl: 'https://forja.example',
  featured: false,
  confidential: false,
  discontinued: false,
} satisfies Project;

describe('buildCaseMarkdown', () => {
  it('opens with YAML frontmatter for the machine fields', () => {
    const text = buildCaseMarkdown({ site, project });

    expect(text.startsWith('---\n')).toBe(true);
    expect(text).toContain('title: Forja');
    expect(text).toContain('url: https://nandomoreira.dev/lab/forja');
    expect(text).toContain('collection: lab');
    expect(text).toContain('tech:');
    expect(text).toContain('- Rust');
    expect(text).toContain('- Tauri');
    expect(text).toContain('date: 2026-05-01');
  });

  it('uses the same pt-BR section headings as the human case page', () => {
    const text = buildCaseMarkdown({ site, project });

    expect(text).toContain('# Forja');
    expect(text).toContain('Multi-CLI GUI client for coding agents');
    expect(text).toContain('## Problema');
    expect(text).toContain('Three terminals, one context loss.');
    expect(text).toContain('## Decisões técnicas');
    expect(text).toContain('Tauri and Rust for a small binary.');
    expect(text).toContain('## Resultado');
    expect(text).toContain('Daily driver for agent work.');
  });

  it('lists repo and live links only when present', () => {
    const withLinks = buildCaseMarkdown({ site, project });
    expect(withLinks).toContain('https://github.com/nandomoreirame/forja');
    expect(withLinks).toContain('https://forja.example');

    const without = buildCaseMarkdown({
      site,
      project: { ...project, repoUrl: null, liveUrl: null } as never,
    });
    expect(without).not.toContain('github.com');
    expect(without).not.toContain('forja.example');
  });

  it('derives the portfolio collection path for professional cases', () => {
    const text = buildCaseMarkdown({
      site,
      project: {
        ...project,
        slug: 'financial-normalization',
        title: 'Financial normalization',
        block: 'professional',
        repoUrl: null,
        liveUrl: null,
      } as never,
    });

    expect(text).toContain('collection: portfolio');
    expect(text).toContain('url: https://nandomoreira.dev/portfolio/financial-normalization');
  });
});
