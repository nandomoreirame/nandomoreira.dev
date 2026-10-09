import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { COLOPHON } from '../../src/lib/about/colophon';
import Sobre from '../../src/pages/sobre.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Sobre, {});
};

describe('COLOPHON content', () => {
  it('is titled as the author asked', () => {
    expect(COLOPHON.title).toBe('Sobre esse site');
  });

  it('covers stack, agents, weight, privacy and process, each with a label', () => {
    expect(COLOPHON.items.map((item) => item.label)).toEqual([
      'Feito com',
      'Para agentes',
      'Leve por padrão',
      'Privacidade',
      'Como foi feito',
    ]);
    for (const item of COLOPHON.items) expect(item.text.length).toBeGreaterThan(20);
  });

  it('links only to routes the site serves, never to the private repository', () => {
    const hrefs = COLOPHON.items.flatMap((item) => (item.link ? [item.link.href] : []));
    expect(hrefs).toEqual(['/mcp', '/privacidade']);
    expect(JSON.stringify(COLOPHON)).not.toContain('github.com');
  });
});

describe('/sobre "Sobre esse site" section', () => {
  it('sits right below Stack', async () => {
    const html = await render();
    const stack = html.indexOf('id="stack-heading"');
    const colophon = html.indexOf('id="colophon-heading"');
    expect(stack).toBeGreaterThan(-1);
    expect(colophon).toBeGreaterThan(stack);
    // Only the colophon's own <h2 opens between the two: no section in between.
    expect(html.slice(stack, colophon).match(/<h2/g) ?? []).toHaveLength(1);
  });

  it('is a labelled section with every item as a term and description', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*aria-labelledby="colophon-heading"/);
    expect(html).toMatch(/<h2[^>]*id="colophon-heading"[^>]*>\s*Sobre esse site/);
    for (const item of COLOPHON.items) {
      expect(html).toMatch(new RegExp(`<dt[^>]*>\\s*${item.label}\\s*</dt>`));
    }
    expect(html).toMatch(/<a[^>]*href="\/mcp"/);
    expect(html).toMatch(/<a[^>]*href="\/privacidade"/);
  });
});
