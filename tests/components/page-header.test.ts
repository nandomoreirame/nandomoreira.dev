import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PageHeader from '../../src/components/ui/PageHeader.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(PageHeader, { props });
};

const base = {
  path: '/lab',
  title: 'Coçando as minhas próprias coceiras',
  description: 'Ferramental para agentes de IA e utilitários de terminal.',
};

describe('PageHeader', () => {
  it('names the page as a terminal path before the only h1, in the accent and lower case', async () => {
    const html = await render(base);
    const eyebrow = html.match(/<p[^>]*data-page-path[^>]*>([^<]*)<\/p>/);

    expect(eyebrow?.[1]).toBe('~/lab');
    expect(eyebrow?.[0]).toContain('text-primary');
    expect(eyebrow?.[0]).not.toContain('uppercase');
    expect(html.indexOf('data-page-path')).toBeLessThan(html.indexOf('<h1'));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('text-display');
  });

  it('sets the title in the editorial serif at its regular weight (Terminal Noir)', async () => {
    const h1 = (await render(base)).match(/<h1[^>]*>/)?.[0] ?? '';

    expect(h1).toContain('font-serif');
    expect(h1).toContain('font-normal');
    expect(h1).not.toContain('font-semibold');
  });

  it('follows the title with a large lead description', async () => {
    const html = await render(base);
    expect(html.indexOf('Ferramental para agentes')).toBeGreaterThan(html.indexOf('</h1>'));
    expect(html).toContain('data-page-lead');
  });

  it('shows only the page name in the eyebrow, never a count', async () => {
    expect(await render(base)).not.toMatch(/\(\d+\)/);
  });

  it('draws no rule under the eyebrow, since two close lines read as a box', async () => {
    expect(await render(base)).not.toMatch(/border-b/);
  });
});
