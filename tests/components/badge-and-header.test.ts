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
});

describe('SectionHeader restyled', () => {
  it('renders the eyebrow in uppercase mono with the wide tracking token', async () => {
    const html = await render(SectionHeader, { title: 'Trabalho selecionado', level: 2 });

    expect(html).toContain('font-mono');
    expect(html).toContain('uppercase');
    expect(html).toContain('tracking-eyebrow');
  });

  it('pads the count to two digits', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2, count: 3 });
    expect(html).toContain('(03)');
  });

  it('omits the count when it is not given', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2 });
    expect(html).not.toMatch(/\(\d\d\)/);
  });

  it('renders a zero count rather than hiding it', async () => {
    const html = await render(SectionHeader, { title: 'X', level: 2, count: 0 });
    expect(html).toContain('(00)');
  });
});
