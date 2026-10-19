import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesHero from '../../src/components/sales/SalesHero.astro';
import ServiceBlocks from '../../src/components/sales/ServiceBlocks.astro';
import SituationGrid from '../../src/components/sales/SituationGrid.astro';
import { careerYearsLabel } from '../../src/lib/format/career-years';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const html = async (component: Parameters<AstroContainer['renderToString']>[0]) =>
  (await AstroContainer.create()).renderToString(component);

describe('SalesHero', () => {
  it('has the page h1 and the two calls', async () => {
    const out = await html(SalesHero);
    expect(out.match(/<h1/g)).toHaveLength(1);
    expect(out).toContain('href="https://nandomoreira.dev/contato?origem=landing"');
    expect(out).toContain('href="#como-trabalho"');
  });

  it('draws the browser windows without a single invented figure', async () => {
    expect(inventedNumbersIn(visibleText(await html(SalesHero)))).toEqual([]);
  });

  it('shows the career years computed at render', async () => {
    const out = await html(SalesHero);
    expect(out).toContain(`${careerYearsLabel()} de código em produção`);
    expect(out).not.toContain('{anos}');
  });

  it('hides the decorative art from screen readers', async () => {
    expect(await html(SalesHero)).toMatch(/data-hero-art[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-hero-art/);
  });

  it('layers the art like the home portrait: tilt on the frame, parallax at three depths', async () => {
    const out = await html(SalesHero);
    expect(out).toMatch(/data-hero-art[^>]*data-parallax[^>]*data-tilt|data-parallax[^>]*data-tilt[^>]*data-hero-art/);
    const depths = [...out.matchAll(/--depth:\s*([\d.]+)/g)].map(match => Number(match[1]));
    expect(depths).toHaveLength(4);
    expect(new Set(depths).size).toBe(4);
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

  it('shows no detail link while SHOW_DETAIL_LINKS is off', async () => {
    const out = await html(ServiceBlocks);
    expect(out).not.toContain('Entender em detalhes');
    expect(out).not.toContain('href="/servicos/site-institucional"');
  });
});
