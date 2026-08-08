import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionHeader from '../../src/components/ui/SectionHeader.astro';
import TechBadge from '../../src/components/ui/TechBadge.astro';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, { props });
};

describe('TechBadge', () => {
  it('always carries the technology name as text, never colour alone', async () => {
    expect(await render(TechBadge, { name: 'Astro' })).toContain('Astro');
  });

  it('wraps a long name instead of pushing the layout sideways', async () => {
    const html = await render(TechBadge, { name: 'model-context-protocol-sdk' });
    expect(html).toContain('break-words');
    expect(html).toContain('max-w-full');
  });

  it('uses the mono family, per the typography rules', async () => {
    expect(await render(TechBadge, { name: 'Zod' })).toContain('font-mono');
  });
});

describe('SectionHeader', () => {
  it('renders the heading level it is told to, so hierarchy never skips', async () => {
    const html = await render(SectionHeader, { title: 'Projetos', level: 2 });
    expect(html).toContain('<h2');
  });

  it('hides the terminal-style numbering from assistive technology', async () => {
    const html = await render(SectionHeader, { title: 'Projetos', level: 2, index: 1 });
    expect(html).toContain('aria-hidden="true"');
  });
});
