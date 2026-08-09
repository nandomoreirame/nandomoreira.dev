import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FeaturedProjects from '../../src/components/home/FeaturedProjects.astro';
import type { Project } from '../../src/content/schemas/project';

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Cliente GUI multi-CLI',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: true,
    confidential: false,
    date: '2026-01-15',
    ...overrides,
  }) as Project;

const render = async (projects: Project[], totalCount?: number) => {
  const container = await AstroContainer.create();
  return container.renderToString(FeaturedProjects, {
    props: { projects, totalCount: totalCount ?? projects.length },
  });
};

describe('FeaturedProjects', () => {
  it('lists rows instead of cards', async () => {
    const html = await render([project()]);

    expect(html).toContain('href="/lab/forja"');
    expect(html).not.toContain('aspect-video');
  });

  it('limits the list to five items', async () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      project({ slug: `p-${i}`, title: `Project ${i}`, date: `2026-0${(i % 9) + 1}-01` }),
    );
    const html = await render(many.slice(0, 5), 7);

    expect((html.match(/Project \d/g) ?? []).length).toBeLessThanOrEqual(5);
  });

  it('shows the see-all link with the total only when there are more items than shown', async () => {
    const withMore = await render([project()], 8);
    expect(withMore).toContain('href="/portfolio"');
    expect(withMore).toMatch(/8|todos/i);

    const exact = await render([project()], 1);
    // When everything fits, the "see all" teaser is unnecessary.
    expect(exact).not.toMatch(/ver todos/i);
  });

  it('renders an explicit empty state instead of vanishing', async () => {
    const html = await render([]);

    expect(html).toMatch(/nenhum|em breve/i);
  });

  it('uses h2, so the hierarchy never skips from h1 to h3', async () => {
    expect(await render([project()])).toContain('<h2');
  });

  it('adds no second primary call to action', async () => {
    expect(await render([project()])).not.toContain('bg-primary');
  });
});
