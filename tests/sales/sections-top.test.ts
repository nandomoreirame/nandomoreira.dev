import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesHero from '../../src/components/sales/SalesHero.astro';
import ServiceBlocks from '../../src/components/sales/ServiceBlocks.astro';
import SituationGrid from '../../src/components/sales/SituationGrid.astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const html = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('SalesHero', () => {
  it('has the page h1 and the two calls', async () => {
    const out = await html(SalesHero);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('href="#contato"');
    expect(out).toContain('href="#como-trabalho"');
  });

  it('draws the browser windows without a single invented figure', async () => {
    expect(inventedNumbersIn(visibleText(await html(SalesHero)))).toEqual([]);
  });

  it('hides the decorative art from screen readers', async () => {
    expect(await html(SalesHero)).toMatch(/data-hero-art[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-hero-art/);
  });
});

describe('SituationGrid', () => {
  it('links each situation to the service anchor on the page', async () => {
    const out = await html(SituationGrid);
    expect(out.match(/href="#servico-/g)).toHaveLength(6);
    expect(out).toContain('href="#servico-loja-virtual"');
  });
});

describe('ServiceBlocks', () => {
  it('renders six anchored services', async () => {
    const out = await html(ServiceBlocks);
    expect(out.match(/id="servico-/g)).toHaveLength(6);
    expect(out).toContain('id="servicos"');
  });

  it('links "Entender em detalhes" only where a detail page exists', async () => {
    const out = await html(ServiceBlocks);
    expect(out.match(/Entender em detalhes/g)).toHaveLength(1);
    expect(out).toContain('href="/servicos/site-institucional"');
  });
});
