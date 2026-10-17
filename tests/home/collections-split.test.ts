import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Index from '../../src/pages/index.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Index, {});
};

// Portfolio and lab left the home on 2026-10-17 (home-latest-post): the
// latest post leads, and each collection lives on its own listing.
describe('home without the collection sections', () => {
  it('renders neither the portfolio nor the lab section', async () => {
    const html = await render();

    expect(html).not.toContain('id="portfolio"');
    expect(html).not.toContain('id="lab"');
  });

  it('keeps the merged section gone too', async () => {
    const html = await render();

    expect(html).not.toContain('id="projetos"');
    expect(html).not.toMatch(/Trabalho selecionado/i);
  });
});
