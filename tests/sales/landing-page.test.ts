import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Landing from '../../src/pages/servicos/index.astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const render = async (query = '') =>
  (await AstroContainer.create()).renderToString(Landing, {
    request: new Request(`https://nandomoreira.dev/servicos${query}`),
  });

describe('/servicos', () => {
  it('renders the sections in the approved order', async () => {
    const html = await render();
    const order = [
      'hero-title',
      'situacao-title',
      'servicos-title',
      'etapas-full',
      'ferramentas-title',
      'projetos-title',
      'depoimentos-title',
      'trabalhos-title',
      'sobre-title',
      'duvidas-title',
      'contato-title',
    ];
    const positions = order.map(id => html.indexOf(`id="${id}"`));
    expect(positions.every(position => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('calls for a quote after every two sections past the hero, and closes with the form after the FAQ', async () => {
    const html = await render();
    const at = (id: string) => html.indexOf(`id="${id}"`);
    const ctas = [...html.matchAll(/data-sales-cta/g)].map(match => match.index!);
    expect(ctas).toHaveLength(3);
    const after = ['servicos-title', 'ferramentas-title', 'depoimentos-title'];
    const before = ['etapas-full', 'projetos-title', 'trabalhos-title'];
    after.forEach((id, index) => expect(ctas[index]!, id).toBeGreaterThan(at(id)));
    before.forEach((id, index) => expect(ctas[index]!, id).toBeLessThan(at(id)));
    expect(ctas[2]!).toBeLessThan(at('sobre-title'));
    expect(at('contato-title')).toBeGreaterThan(at('duvidas-title'));
  });

  it('sends every call to the form on the page, each with its own title', async () => {
    const html = await render();
    const blocks = html
      .split('data-sales-cta')
      .slice(1)
      .map(chunk => chunk.slice(0, chunk.indexOf('</section>')));
    const titles = blocks.map(block => block.match(/<h2[^>]*>([^<]+)<\/h2>/)?.[1]);
    expect(new Set(titles).size).toBe(3);
    for (const block of blocks) {
      expect(block).toContain('href="#contato"');
      expect(block).toContain('Pedir orçamento');
    }
  });

  it('has exactly one h1', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('shows no invented figure anywhere on the page', async () => {
    expect(inventedNumbersIn(visibleText(await render()))).toEqual([]);
  });

  it('closes with its own form, so the visitor never leaves the page', async () => {
    const html = await render();
    expect(html).toContain('id="contato"');
    expect(html).toContain('action="/api/hire?origem=landing"');
    expect(html).not.toContain('/contato?origem=');
  });

  it('shows the outcome of a sent form in place of the form', async () => {
    const html = await render('?envio=ok');
    expect(html).toMatch(/role="status"/);
    expect(html).not.toContain('action="/api/hire');
  });
});
