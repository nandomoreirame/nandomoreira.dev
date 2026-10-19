import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Contato from '../../src/pages/contato.astro';

const render = async (query = '') => {
  const container = await AstroContainer.create();
  return container.renderToString(Contato, { request: new Request(`https://nandomoreira.dev/contato${query}`) });
};

const main = (html: string) => html.slice(html.indexOf('<main'), html.indexOf('</main>'));

const formCard = (html: string) => {
  const start = html.search(/<section[^>]*aria-labelledby="form-heading"/);
  return html.slice(start, html.indexOf('</section>', start));
};

describe('/contato, the one contact form', () => {
  it('offers WhatsApp to every visitor inside the form card, through /go', async () => {
    for (const query of ['', '?origem=landing']) {
      const card = formCard(main(await render(query)));
      expect(card, query).toMatch(/<a[^>]*href="\/go\/contato\/whatsapp"[^>]*target="_blank"/);
      expect(card.indexOf('Enviar mensagem'), query).toBeLessThan(card.indexOf('/go/contato/whatsapp'));
    }
  });

  it('keeps the two-column grid for a plain visit', async () => {
    const tag = main(await render()).match(/<section[^>]*aria-labelledby="form-heading"[^>]*>/)?.[0] ?? '';
    expect(tag).toMatch(/lg:col-span-2/);
  });

  it('keeps the agent brief, the MCP card and the link to the services for a plain visit', async () => {
    const html = main(await render());
    expect(html).toContain('id="agent-brief"');
    expect(html).toContain('id="mcp-url"');
    expect(html).toContain('Ver os serviços');
    expect(html).not.toContain('name="servico"');
  });
});

describe('/contato reached from a sales page', () => {
  it('shows the chosen service and posts it along, hidden', async () => {
    const html = main(await render('?origem=site-institucional&servico=website'));
    expect(html).toMatch(/<input[^>]*type="hidden"[^>]*name="servico"[^>]*value="website"|<input[^>]*name="servico"[^>]*type="hidden"[^>]*value="website"/);
    expect(html).toContain('Site institucional');
  });

  it('drops what is for agents and developers, and the way back to the services', async () => {
    const html = main(await render('?origem=landing'));
    expect(html).not.toContain('id="agent-brief"');
    expect(html).not.toContain('id="mcp-url"');
    expect(html).not.toContain('Ver os serviços');
    expect(html).toMatch(/<a[^>]*href="\/go\/contato\/whatsapp"/);
  });

  it('centres the form alone, half again as wide as the grid column', async () => {
    const html = main(await render('?origem=landing'));
    const tag = html.match(/<section[^>]*aria-labelledby="form-heading"[^>]*>/)?.[0] ?? '';
    expect(tag).toMatch(/\bmx-auto\b/);
    expect(tag).toMatch(/\bw-full\b/);
    expect(tag).toMatch(/max-w-\[60ch\]/);
    expect(tag).not.toMatch(/lg:col-span-2/);
    expect(html).not.toMatch(/lg:col-span-3/);
  });

  it('marks the freelance interest for a project', async () => {
    const html = main(await render('?origem=landing'));
    expect(html).toMatch(/<input[^>]*value="freelance"[^>]*checked/);
  });

  it('ignores a service outside the list', async () => {
    const html = main(await render('?servico=toString'));
    expect(html).not.toContain('name="servico"');
    expect(html).toContain('id="agent-brief"');
  });
});
