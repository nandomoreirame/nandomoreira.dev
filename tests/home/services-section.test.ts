import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from '../../src/components/home/Services.astro';

const services = [
  {
    title: 'Tooling com agentes',
    description: 'Ferramental interno para times que usam agentes de código.',
    caseSlug: 'forja',
  },
];

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(Services, props ? { props } : undefined);
};

describe('Services', () => {
  it('links every service to the case that proves it', async () => {
    const html = await render({ services, knownSlugs: ['forja'] });
    expect(html).toContain('href="/projetos/forja"');
  });

  it('fails the build when a service references a case that does not exist', async () => {
    await expect(render({ services, knownSlugs: [] })).rejects.toThrow(/forja/);
  });

  it('adds no second primary call to action', async () => {
    const html = await render({ services, knownSlugs: ['forja'] });
    expect(html).not.toContain('bg-primary');
  });

  it('uses h3 for each service, under the section h2', async () => {
    const html = await render({ services, knownSlugs: ['forja'] });

    expect(html).toContain('<h2');
    expect(html).toContain('<h3');
  });
});
