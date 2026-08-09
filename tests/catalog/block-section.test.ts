import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BlockSection from '../../src/components/catalog/BlockSection.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI',
  tech: ['Rust'],
};

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(BlockSection, { props });
};

describe('BlockSection', () => {
  it('shows the human label of the block, not the slug', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });

    expect(html).toContain('Ferramental de AI coding');
    expect(html).not.toContain('>ai-tooling<');
  });

  it('renders an explicit empty state instead of vanishing', async () => {
    const html = await render({ block: 'systems-cli', projects: [], index: 3 });

    expect(html).toContain('Sistemas e CLI em Rust e Go');
    expect(html).toMatch(/nenhum case|em breve/i);
  });

  it('goes from one column to two and then three', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });

    expect(html).toContain('grid-cols-1');
    expect(html).toContain('sm:grid-cols-2');
    expect(html).toContain('lg:grid-cols-3');
  });

  it('uses a list, so assistive tech announces how many cases there are', async () => {
    const html = await render({ block: 'ai-tooling', projects: [project], index: 1 });
    expect(html).toContain('<ul');
  });
});
