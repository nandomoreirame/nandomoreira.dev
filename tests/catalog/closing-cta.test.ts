import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ClosingCta from '../../src/components/catalog/ClosingCta.astro';
import { CLOSING_CTA } from '../../src/lib/catalog/closing-cta';
import Lab from '../../src/pages/lab/index.astro';
import Portfolio from '../../src/pages/portfolio/index.astro';

describe('closing CTA', () => {
  it('carries the approved copy per collection', () => {
    expect(CLOSING_CTA.portfolio.title).toBe('Precisa de algo assim no seu produto?');
    expect(CLOSING_CTA.lab.title).toBe('Tem um problema parecido no seu fluxo?');
    expect(CLOSING_CTA.portfolio.button).toBe('Vamos conversar');
  });

  it('is a card with an eyebrow, a serif title and one primary button to /contato with an arrow', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ClosingCta, { props: { collection: 'portfolio' } });
    expect(html).toContain('Próximo passo');
    expect(html).toMatch(/<h2[^>]*class="[^"]*\bfont-serif\b[^"]*\bfont-normal\b/);
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
    expect(html).toMatch(/<a[^>]*href="\/contato"[^>]*>[\s\S]*?lucide:arrow-right/);
  });

  it.each([
    ['portfolio', Portfolio, 'Precisa de algo assim no seu produto?'],
    ['lab', Lab, 'Tem um problema parecido no seu fluxo?'],
  ])('closes /%s', async (_name, Page, title) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page);
    expect(html).toContain(title);
  });
});
