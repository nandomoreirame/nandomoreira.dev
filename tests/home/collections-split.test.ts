import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Index from '../../src/pages/index.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Index, {});
};

describe('home splits portfolio from lab', () => {
  it('renders both collection sections', async () => {
    const html = await render();

    expect(html).toContain('id="portfolio"');
    expect(html).toContain('id="lab"');
  });

  it('puts portfolio before lab, since delivered work leads', async () => {
    const html = await render();
    expect(html.indexOf('id="portfolio"')).toBeLessThan(html.indexOf('id="lab"'));
  });

  it('drops the merged section, which mixed both collections', async () => {
    const html = await render();

    expect(html).not.toContain('id="projetos"');
    expect(html).not.toMatch(/Trabalho selecionado/i);
  });

  it('never shows a lab case inside portfolio, or the reverse', async () => {
    const html = await render();
    const portfolio = html.slice(html.indexOf('id="portfolio"'), html.indexOf('id="lab"'));
    const lab = html.slice(html.indexOf('id="lab"'));

    // Asserting on the hrefs alone is not enough: the row href is built from
    // the section, so a mixed-in case still renders a section-shaped link
    // (a dead one). CollectionSection throws on a foreign case; the assertion
    // that this actually holds lives in collection-section.test.ts.
    expect(portfolio).not.toMatch(/href="\/lab\//);
    expect(lab).not.toMatch(/href="\/portfolio\//);
  });

  it('never sends a section to the other collection listing', async () => {
    const html = await render();
    const portfolio = html.slice(html.indexOf('id="portfolio"'), html.indexOf('id="lab"'));

    // The see-all link only appears once a collection outgrows the five the
    // home shows, so assert the invariant that holds either way: whatever
    // listing link a section carries, it is its own.
    expect(portfolio).not.toMatch(/href="\/lab"/);
  });
});
