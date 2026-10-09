import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NotFound from '../../src/pages/404.astro';
import Mcp from '../../src/pages/mcp.astro';
import Contato from '../../src/pages/contato.astro';
import Lab from '../../src/pages/lab/index.astro';
import Portfolio from '../../src/pages/portfolio/index.astro';
import Arquivo from '../../src/pages/posts/arquivo/index.astro';
import Posts from '../../src/pages/posts/index.astro';

const PAGES = [
  ['/portfolio', Portfolio, 'Portfólio'],
  ['/lab', Lab, 'Laboratório'],
  ['/posts', Posts, 'Posts'],
  ['/posts/arquivo', Arquivo, 'Arquivo'],
  ['/contato', Contato, 'Contato'],
  ['/mcp', Mcp, 'Agentes · MCP'],
  ['/404', NotFound, '404'],
] as const;

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

describe.each(PAGES)('%s header', (_route, Page, eyebrow) => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Page);
  };

  it('opens with the eyebrow, a single h1 and a lead description, like /sobre', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));

    expect(main.match(/<h1/g)).toHaveLength(1);
    expect(main.indexOf(eyebrow)).toBeLessThan(main.indexOf('<h1'));
    expect(main).toContain('data-page-lead');
  });

  it('never repeats the page name as its title or as a heading below it', async () => {
    const html = await render();
    const main = html.slice(html.indexOf('<main'));
    const h1 = text(main.slice(main.indexOf('<h1'), main.indexOf('</h1>') + 5));

    expect(h1.toLowerCase()).not.toBe(eyebrow.toLowerCase());
    const headings = [...main.matchAll(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/g)].map(([, inner]) =>
      text(inner).toLowerCase(),
    );
    expect(headings).not.toContain(eyebrow.toLowerCase());
  });
});

describe('page titles without counts', () => {
  it.each(PAGES)('%s names the page without a total beside it', async (_route, Page) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Page);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</h1>'));
    expect(main).not.toMatch(/\(\d+\)/);
  });
});
