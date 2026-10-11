import { describe, expect, it } from 'vitest';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling.',
  availability: {
    status: 'open',
    detail: 'Open.',
    updatedAt: '2026-08-08',
  },
} as never;

const projects = [
  {
    slug: 'forja',
    title: 'Forja',
    summary: 'Multi-CLI GUI client',
    block: 'ai-tooling',
    tech: ['Rust'],
  },
  {
    slug: 'financial-normalization',
    title: 'Financial normalization',
    summary: 'Financial data pipeline',
    block: 'professional',
    tech: ['Python'],
  },
] as never[];

const posts = [
  {
    slug: 'tailwind-parens',
    title: 'Why parens in Tailwind 4',
    summary: 'Brackets emit invalid CSS.',
    date: '2026-08-09',
  },
] as never[];

const index = () => buildAiIndex({ site, profile, projects, posts });

describe('buildAiIndex', () => {
  it('exposes the top-level identity fields', () => {
    const data = index();

    expect(data.name).toBe('Fernando Moreira Costa');
    expect(data.headline).toBe('Product engineer working with AI agents');
    expect(data.url).toBe('https://nandomoreira.dev/');
    expect(data.updatedAt).toBe('2026-08-08');
    expect(data.language).toEqual({ human: 'pt-BR', machine: 'en' });
    expect(data.availability).toEqual({ status: 'open', updatedAt: '2026-08-08' });
  });

  it('lists one page entry per public surface', () => {
    const pages = index().entries.filter((entry) => entry.type === 'page');
    const urls = pages.map((entry) => entry.url);

    expect(urls).toEqual([
      'https://nandomoreira.dev/',
      'https://nandomoreira.dev/sobre',
      'https://nandomoreira.dev/portfolio',
      'https://nandomoreira.dev/lab',
      'https://nandomoreira.dev/posts',
      'https://nandomoreira.dev/mcp',
      'https://nandomoreira.dev/setup',
      'https://nandomoreira.dev/now',
    ]);
  });

  it('lists one case entry per project with a markdown alternate URL', () => {
    const cases = index().entries.filter((entry) => entry.type === 'case');

    expect(cases).toEqual([
      {
        type: 'case',
        url: 'https://nandomoreira.dev/lab/forja',
        title: 'Forja',
        summary: 'Multi-CLI GUI client',
        collection: 'lab',
        tech: ['Rust'],
        markdown: 'https://nandomoreira.dev/lab/forja.md',
      },
      {
        type: 'case',
        url: 'https://nandomoreira.dev/portfolio/financial-normalization',
        title: 'Financial normalization',
        summary: 'Financial data pipeline',
        collection: 'portfolio',
        tech: ['Python'],
        markdown: 'https://nandomoreira.dev/portfolio/financial-normalization.md',
      },
    ]);
  });

  it('lists one post entry per published post', () => {
    const postEntries = index().entries.filter((entry) => entry.type === 'post');

    expect(postEntries).toEqual([
      {
        type: 'post',
        url: 'https://nandomoreira.dev/tailwind-parens',
        title: 'Why parens in Tailwind 4',
        summary: 'Brackets emit invalid CSS.',
        date: '2026-08-09',
      },
    ]);
  });

  it('lists the machine routes with one-line English descriptions', () => {
    const routes = index().machineRoutes.map((route) => route.path);

    expect(routes).toEqual([
      '/llms.txt',
      '/llms-full.txt',
      '/ai-index.json',
      '/AGENTS.md',
      '/sitemap.xml',
      '/api/resume.json',
      '/api/resume.txt',
      '/api/mcp',
      '/api/hire',
    ]);

    for (const route of index().machineRoutes) {
      expect(route.description.length).toBeGreaterThan(0);
      expect(route.url).toBe(`https://nandomoreira.dev${route.path}`);
    }
  });
});
