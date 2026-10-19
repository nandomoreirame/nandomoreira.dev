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
    expect(CLOSING_CTA.portfolio.title).toBe('Precisa de algo assim no seu produto?');
    expect(CLOSING_CTA.lab.title).toBe('Tem um problema parecido no seu fluxo?');
    expect(CLOSING_CTA.portfolio.button).toBe('Vamos conversar');
  });

  it('is a card with an eyebrow, a serif title and one primary button to /contato with an arrow', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, { props: { page: 'portfolio' } });
    expect(html).toContain('Próximo passo');
    expect(html).toMatch(/<h2[^>]*class="[^"]*\bfont-serif\b[^"]*\bfont-normal\b/);
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?lucide:arrow-right/);
  });

  it('drops to a secondary button when quiet, for a page that already has its primary', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, { props: { page: 'sobre', quiet: true } });
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toBeNull();
    expect(html).toMatch(/<a[^>]*href="\/contato"/);
  });

  it.each([
    ['portfolio', Portfolio, 'Precisa de algo assim no seu produto?'],
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

  it('gives every page its own title and a button to /contato', () => {
    const titles = Object.values(CLOSING_CTA).map(copy => copy.title);
    expect(new Set(titles).size).toBe(titles.length);
    for (const copy of Object.values(CLOSING_CTA)) {
      expect(copy.text).not.toMatch(/[\u2013\u2014]/);
      expect(copy.button).toBe('Vamos conversar');
    }
  });
});
