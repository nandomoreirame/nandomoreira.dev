import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async (props: {
  title?: string;
  description?: string;
  markdownAlternate?: string;
} = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: {
      title: props.title ?? 'Título',
      description: props.description ?? 'Descrição da página',
      markdownAlternate: props.markdownAlternate,
    },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('BaseLayout head discovery tags', () => {
  it('declares Twitter Card metadata mirroring the Open Graph title and description', async () => {
    const html = await render({
      title: 'Case title',
      description: 'Case summary',
    });

    expect(html).toContain('<meta name="twitter:card" content="summary">');
    expect(html).toContain('<meta name="twitter:title" content="Case title">');
    expect(html).toContain('<meta name="twitter:description" content="Case summary">');
  });

  it('advertises the machine discovery alternates', async () => {
    const html = await render();

    expect(html).toContain(
      '<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM summary">',
    );
    expect(html).toContain(
      '<link rel="alternate" type="text/plain" href="/llms-full.txt" title="LLM full content">',
    );
    expect(html).toContain(
      '<link rel="alternate" type="application/json" href="/ai-index.json" title="AI index">',
    );
  });

  it('renders a markdown alternate only when the page opts in', async () => {
    const without = await render();
    expect(without).not.toContain('type="text/markdown"');

    const withMd = await render({ markdownAlternate: '/lab/forja.md' });
    expect(withMd).toContain(
      '<link rel="alternate" type="text/markdown" href="/lab/forja.md">',
    );
  });
});
