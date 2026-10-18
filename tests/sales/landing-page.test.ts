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
    const order = ['hero-title', 'situacao-title', 'servicos-title', 'etapas-full', 'ferramentas-title', 'projetos-title', 'depoimentos-title', 'trabalhos-title', 'sobre-title', 'duvidas-title', 'contato-title'];
    const positions = order.map((id) => html.indexOf(`id="${id}"`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('has exactly one h1', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('shows no invented figure anywhere on the page', async () => {
    expect(inventedNumbersIn(visibleText(await render()))).toEqual([]);
  });

  it('reads the form outcome from the query', async () => {
    expect(await render('?envio=ok')).toMatch(/role="status"/);
  });

  it('posts the form as the landing', async () => {
    expect(await render()).toContain('action="/api/hire?origem=landing"');
  });
});
