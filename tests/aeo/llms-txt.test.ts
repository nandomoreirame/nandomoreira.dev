import { describe, expect, it } from 'vitest';
import { buildLlmsTxt } from '../../src/lib/aeo/llms-txt';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling and AI products in production.',
  contacts: [{ kind: 'email', value: 'fernando@nandomoreira.dev' }],
} as never;

const projects = [
  {
    slug: 'forja',
    title: 'Forja',
    summary: 'Multi-CLI GUI client for coding agents',
    block: 'ai-tooling',
  },
  {
    slug: 'bragstack',
    title: 'Bragstack',
    summary: 'Career brag doc generator',
    block: 'ai-product',
  },
] as never[];

const output = () => buildLlmsTxt({ site, profile, projects });

describe('buildLlmsTxt', () => {
  it('opens with an H1 title, per the llms.txt convention', () => {
    expect(output().split('\n')[0]).toMatch(/^# /);
  });

  it('follows the title with a blockquote summary', () => {
    expect(output()).toMatch(/\n> /);
  });

  it('lists every project on its collection path, derived from the access layer', () => {
    const text = output();

    expect(text).toContain('Forja');
    expect(text).toContain('Bragstack');
    expect(text).toContain('/lab/forja');
    expect(text).toContain('/portfolio/bragstack');
    expect(text).not.toContain('/projetos/');
  });

  it('lists the machine routes so an agent can find them', () => {
    const text = output();

    for (const route of ['/api/resume.json', '/api/resume.txt', '/api/mcp', '/api/hire']) {
      expect(text).toContain(route);
    }
  });

  it('uses absolute urls', () => {
    expect(output()).toContain('https://nandomoreira.dev/lab/forja');
  });

  it('never leaks the email address', () => {
    expect(output()).not.toContain('@nandomoreira.dev');
  });

  it('stays in English, since the machine layer is English-only', () => {
    expect(output()).not.toMatch(/Projetos|Contato|Trajetória/);
  });

  it('survives an empty catalogue', () => {
    expect(() => buildLlmsTxt({ site, profile, projects: [] })).not.toThrow();
  });

  it('lists published notes with absolute urls', () => {
    const text = buildLlmsTxt({
      site,
      profile,
      projects,
      notes: [
        {
          slug: 'tailwind-parens',
          title: 'Why parens in Tailwind 4',
          summary: 'Brackets emit invalid CSS.',
          date: '2026-08-09',
          draft: false,
        },
      ] as never[],
    });

    expect(text).toContain('## Notes');
    expect(text).toContain('https://nandomoreira.dev/notas/tailwind-parens');
    expect(text).toContain('Why parens in Tailwind 4');
  });

  it('omits the notes section when none are published', () => {
    expect(output()).not.toMatch(/## Notes\n/);
  });
});
