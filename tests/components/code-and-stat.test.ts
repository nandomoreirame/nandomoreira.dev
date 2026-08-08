import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CodeBlock from '../../src/components/ui/CodeBlock.astro';
import StatItem from '../../src/components/ui/StatItem.astro';

const render = async (
  component: unknown,
  props: Record<string, unknown>,
  slot?: string,
) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, {
    props,
    slots: slot ? { default: slot } : undefined,
  });
};

describe('CodeBlock', () => {
  it('labels the language, so the reader knows what they are looking at', async () => {
    const html = await render(CodeBlock, { language: 'bash' }, 'curl /api/mcp');
    expect(html).toContain('bash');
  });

  it('scrolls inside its own container instead of widening the page', async () => {
    const html = await render(CodeBlock, { language: 'json' }, '{}');
    expect(html).toContain('overflow-x-auto');
  });
});

describe('StatItem', () => {
  it('refuses a number without context, which RISK-004 forbids', async () => {
    await expect(render(StatItem, { value: '964' })).rejects.toThrow(/context/i);
  });

  it('renders the number together with the narrative that explains it', async () => {
    const html = await render(StatItem, {
      value: '964',
      label: 'estrelas no GitHub',
      context: 'cerca de 700 vêm de temas Jekyll de 2018',
    });

    expect(html).toContain('964');
    expect(html).toContain('estrelas no GitHub');
    expect(html).toContain('cerca de 700 vêm de temas Jekyll de 2018');
  });
});
