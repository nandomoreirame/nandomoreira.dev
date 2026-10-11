import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from '../../src/components/home/Services.astro';
import ServiceCards from '../../src/components/ui/ServiceCards.astro';

const services = [
  {
    title: 'Tooling com agentes',
    description: 'Ferramental interno para times que usam agentes de código.',
    caseSlug: 'forja',
  },
];

const projects = [{ slug: 'forja', block: 'ai-tooling' as const }];

const render = async (component: unknown, props?: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, props ? { props } : undefined);
};

describe('Services', () => {
  it('links every service to the real case route that proves it', async () => {
    const html = await render(Services, { services, projects });
    expect(html).toContain('href="/lab/forja"');
    expect(html).not.toContain('href="/projetos/forja"');
  });

  it('labels the proof link with the shared copy', async () => {
    const html = await render(Services, { services, projects });
    expect(html).toContain('Ver o case que comprova');
  });

  it('fails the build when a service references a case that does not exist', async () => {
    await expect(render(Services, { services, projects: [] })).rejects.toThrow(/forja/);
  });

  it('adds no second primary call to action', async () => {
    const html = await render(Services, { services, projects });
    expect(html).not.toContain('bg-primary');
  });

  it('uses h3 for each service, under the section h2', async () => {
    const html = await render(Services, { services, projects });

    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
  });

  it('uses a three-column grid at lg', async () => {
    const html = await render(Services, { services, projects });
    expect(html).toContain('lg:grid-cols-3');
    expect(html).not.toContain('sm:grid-cols-2');
  });
});

describe('shared ServiceCards', () => {
  it('is the card list used by both the home Services section and /sobre', () => {
    const home = readFileSync('src/components/home/Services.astro', 'utf8');
    const sobre = readFileSync('src/pages/sobre.astro', 'utf8');

    expect(home).toContain('ServiceCards');
    expect(sobre).toContain('ServiceCards');
  });

  it('renders only the card list, with the shared proof link', async () => {
    const html = await render(ServiceCards, { services, projects });

    expect(html).toContain('href="/lab/forja"');
    expect(html).toContain('Ver o case que comprova');
    expect(html).toContain('lg:grid-cols-3');
    expect(html).not.toContain('O que eu faço por você');
    expect(html).not.toContain('Como posso ajudar');
  });
});
