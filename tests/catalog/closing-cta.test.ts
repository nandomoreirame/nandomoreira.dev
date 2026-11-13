import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ClosingCta from '../../src/components/catalog/ClosingCta.astro';
import { CLOSING_CTA } from '../../src/lib/catalog/closing-cta';
import Lab from '../../src/pages/lab/index.astro';
import Portfolio from '../../src/pages/portfolio/index.astro';
import Sobre from '../../src/pages/sobre.astro';
import Mcp from '../../src/pages/mcp.astro';
import Now from '../../src/pages/now.astro';

describe('closing CTA', () => {
  it('carries the approved copy per collection', () => {
    expect(CLOSING_CTA.portfolio.title).toBe('Precisa de um site, loja ou sistema?');
    expect(CLOSING_CTA.lab.title).toBe('Tem um problema parecido no seu fluxo?');
    expect(CLOSING_CTA.portfolio.button).toBe('Ver os serviços');
    expect(CLOSING_CTA.lab.button).toBe('Vamos conversar');
  });

  it('is a card with an eyebrow, a serif title and one primary button with an arrow', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, { props: { page: 'lab' } });
    expect(html).toContain('Próximo passo');
    expect(html).toMatch(/<h2[^>]*class="[^"]*\bfont-serif\b[^"]*\bfont-normal\b/);
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?lucide:arrow-right/);
  });

  it.each(['portfolio', 'sobre'] as const)('sends /%s to the services page', async page => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, {
      props: { page },
      request: new Request(`https://nandomoreira.dev/${page}`),
    });
    expect(html).toMatch(/<a[^>]*href="https:\/\/contrate\.nandomoreira\.dev\/"[^>]*>[\s\S]*?Ver os serviços/);
    expect(html).not.toContain('href="/contato"');
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
  });

  it('shows the same card on /portfolio and /sobre', () => {
    expect(CLOSING_CTA.sobre).toEqual(CLOSING_CTA.portfolio);
  });

  it.each([
    ['portfolio', Portfolio, 'Precisa de um site, loja ou sistema?'],
    ['lab', Lab, 'Tem um problema parecido no seu fluxo?'],
    ['sobre', Sobre, CLOSING_CTA.sobre.title],
    ['mcp', Mcp, CLOSING_CTA.mcp.title],
    ['now', Now, CLOSING_CTA.now.title],
  ])('closes /%s', async (name, Page, title) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page, { request: new Request(`https://nandomoreira.dev/${name}`) });
    expect(html).toContain(title);
    // The card is the last thing in <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main.slice(main.lastIndexOf('<h2'))).toContain(title);
  });

  it('gives every other page its own title and a button to /contato', () => {
    const { sobre: _sameAsPortfolio, portfolio: services, ...others } = CLOSING_CTA;
    const titles = [services, ...Object.values(others)].map(copy => copy.title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(services.text).not.toMatch(/[\u2013\u2014]/);
    for (const copy of Object.values(others)) {
      expect(copy.text).not.toMatch(/[\u2013\u2014]/);
      expect(copy.button).toBe('Vamos conversar');
    }
  });
});
