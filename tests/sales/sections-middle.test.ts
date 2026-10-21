import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import StepsTimeline from '../../src/components/sales/StepsTimeline.astro';
import ToolsGrid from '../../src/components/sales/ToolsGrid.astro';
import { SALES_COPY } from '../../src/lib/sales/copy';

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
  it('leads with what the infrastructure does for the client, no product names', async () => {
    const html = await render(ToolsGrid);
    const visible = html.slice(0, html.indexOf('<details'));
    expect(visible.match(/<h3/g)).toHaveLength(SALES_COPY.toolBenefits.length);
    for (const benefit of SALES_COPY.toolBenefits) expect(visible).toContain(benefit.title);
    for (const tool of SALES_COPY.tools) expect(visible).not.toContain(tool.name);
  });

  it('keeps every tool and its shop analogy behind a native disclosure', async () => {
    const html = await render(ToolsGrid);
    const details = html.slice(html.indexOf('<details'));
    expect(details).toMatch(/<summary[^>]*>[\s\S]*Ver as ferramentas por trás/);
    for (const tool of SALES_COPY.tools) {
      expect(details).toContain(tool.name);
      expect(details).toContain(tool.analogy);
    }
  });
});
