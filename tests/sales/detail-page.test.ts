import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Detail from '../../src/pages/servicos/[slug].astro';
import { inventedNumbersIn, visibleText } from '../helpers/invented-numbers';

const render = async (slug: string) => {
  const container = await AstroContainer.create();
  return container.renderToResponse(Detail, {
    params: { slug },
    request: new Request(`https://nandomoreira.dev/servicos/${slug}`),
  });
};

describe('/servicos/site-institucional', () => {
  it('answers 200 with breadcrumb and one h1', async () => {
    const response = await render('site-institucional');
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain('aria-label="Trilha"');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('builds an accessible comparison table', async () => {
    const html = await (await render('site-institucional')).text();
    expect(html).toContain('<caption');
    expect(html.match(/scope="col"/g)?.length).toBeGreaterThanOrEqual(3);
    expect(html.match(/scope="row"/g)).toHaveLength(4);
  });

  it('lists the editing panel among the add-ons', async () => {
    expect(await (await render('site-institucional')).text()).toContain('Painel de edição');
  });

  it('shows none of the Stitch hosting figures', async () => {
    expect(inventedNumbersIn(visibleText(await (await render('site-institucional')).text()))).toEqual([]);
  });

  it('preselects its own service in the form and posts as itself', async () => {
    const html = await (await render('site-institucional')).text();
    expect(html).toContain('action="/api/hire?origem=site-institucional"');
    expect(html).toMatch(/<option[^>]*value="website"[^>]*selected/);
  });
});

describe('/servicos/<other>', () => {
  it.each(['loja-virtual', 'nada-aqui'])('answers 404 for %s', async slug => {
    expect((await render(slug)).status).toBe(404);
  });
});
