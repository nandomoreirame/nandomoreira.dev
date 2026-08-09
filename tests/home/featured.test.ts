import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FeaturedProjects from '../../src/components/home/FeaturedProjects.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI',
  tech: ['Rust'],
};

const render = async (projects: unknown[]) => {
  const container = await AstroContainer.create();
  return container.renderToString(FeaturedProjects, { props: { projects } });
};

describe('FeaturedProjects', () => {
  it('always links to the full catalogue', async () => {
    expect(await render([project])).toContain('href="/projetos"');
  });

  it('renders an explicit empty state instead of vanishing', async () => {
    const html = await render([]);

    expect(html).toMatch(/nenhum|em breve/i);
    expect(html).toContain('href="/projetos"');
  });

  it('uses h2, so the hierarchy never skips from h1 to h3', async () => {
    expect(await render([project])).toContain('<h2');
  });

  it('adds no second primary call to action', async () => {
    expect(await render([project])).not.toContain('bg-primary');
  });
});
