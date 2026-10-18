import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import StepsTimeline from '../../src/components/sales/StepsTimeline.astro';
import ToolsGrid from '../../src/components/sales/ToolsGrid.astro';

const render = async (component: Parameters<AstroContainer['renderToString']>[0], props = {}) =>
  (await AstroContainer.create()).renderToString(component, { props });

describe('StepsTimeline', () => {
  it('lists the seven steps in an ordered list', async () => {
    const html = await render(StepsTimeline);
    expect(html).toContain('<ol');
    expect(html.match(/<li/g)).toHaveLength(7);
    expect(html).toContain('id="como-trabalho"');
  });

  it('labels the approval steps in text, not only by colour', async () => {
    const html = await render(StepsTimeline);
    expect(html).toContain('Você aprova antes');
    expect(html).toContain('Sem surpresas');
  });

  it('has a compact variant without "o que você faz" for the detail page', async () => {
    const html = await render(StepsTimeline, { variant: 'compact' });
    expect(html.match(/<li/g)).toHaveLength(7);
    expect(html).not.toContain('O que você faz');
  });
});

describe('ToolsGrid', () => {
  it('shows each tool with its shop analogy', async () => {
    const html = await render(ToolsGrid);
    expect(html).toContain('O porteiro');
    expect(html).toContain('Cloud Functions');
    expect(html).toContain('O carteiro');
    expect(html.match(/<li/g)).toHaveLength(9);
  });
});
