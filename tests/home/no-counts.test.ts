import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CollectionSection from '../../src/components/home/CollectionSection.astro';
import type { Project } from '../../src/content/schemas/project';

const project = (slug: string) =>
  ({
    slug,
    title: slug,
    block: 'professional',
    summary: 's',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['TypeScript'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: false,
    confidential: false,
    discontinued: false,
    date: '2026-01-01',
  }) as Project;

describe('home collection sections', () => {
  it('print no totals, in the header or in the link to the full listing', async () => {
    const container = await AstroContainer.create();
    const projects = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(project);
    const html = await container.renderToString(CollectionSection, {
      props: { collection: 'portfolio', projects, totalCount: projects.length, index: 1 },
    });

    expect(html).not.toMatch(/\(\d+\)/);
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('Ver todos');
  });
});
