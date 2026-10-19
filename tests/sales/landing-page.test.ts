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
    const order = ['hero-title', 'situacao-title', 'servicos-title', 'etapas-full', 'ferramentas-title', 'projetos-title', 'depoimentos-title', 'trabalhos-title', 'sobre-title', 'duvidas-title'];
    const positions = order.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('calls for a quote after every two sections past the hero, and closes with one after the FAQ', async () => {
    const html = await render();
    const at = (id: string) => html.indexOf(`id="${id}"`);
    const ctas = [...html.matchAll(/data-sales-cta/g)].map((match) => match.index!);
    expect(ctas).toHaveLength(4);
    const after = ['servicos-title', 'ferramentas-title', 'depoimentos-title', 'duvidas-title'];
    const before = ['etapas-full', 'projetos-title', 'trabalhos-title'];
    after.forEach((id, index) => expect(ctas[index]!, id).toBeGreaterThan(at(id)));
    before.forEach((id, index) => expect(ctas[index]!, id).toBeLessThan(at(id)));
    expect(html.indexOf('</main>')).toBeGreaterThan(ctas[3]!);
    // No call right above the FAQ: the closing one sits just below it.
    expect(ctas[2]!).toBeLessThan(at('sobre-title'));
  });

  it('sends every call to /contato as the landing, each with its own title', async () => {
    const html = await render();
    const blocks = html.split('data-sales-cta').slice(1).map((chunk) => chunk.slice(0, chunk.indexOf('</section>')));
    const titles = blocks.map((block) => block.match(/<h2[^>]*>([^<]+)<\/h2>/)?.[1]);
    expect(new Set(titles).size).toBe(4);
    expect(titles[3]).toBe('Vamos conversar sobre o seu projeto?');
    for (const block of blocks) {
      expect(block).toContain('href="https://nandomoreira.dev/contato?origem=landing"');
      expect(block).toContain('Pedir orçamento');
    }
  });

  it('has exactly one h1', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('shows no invented figure anywhere on the page', async () => {
    expect(inventedNumbersIn(visibleText(await render()))).toEqual([]);
  });

  it('has no form of its own: every call goes to the one form on /contato', async () => {
    const html = await render();
    expect(html).not.toContain('id="contato"');
    expect(html).not.toContain('action="/api/hire');
    expect(html).not.toContain('href="#contato"');
    expect(html).toContain('href="https://nandomoreira.dev/contato?origem=landing"');
  });
});
