import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from '../../src/components/home/Services.astro';
import Contato from '../../src/pages/contato.astro';

describe('entry points to the sales landing', () => {
  it('links from the home services section, without a second primary CTA', async () => {
    const html = await (await AstroContainer.create()).renderToString(Services, {
      props: { services: [], projects: [] },
    });
    expect(html).toContain('href="https://contrate.nandomoreira.dev/"');
    expect(html).toContain('Para o seu negócio');
    expect(html).not.toContain('bg-primary');
  });

  it('links from /contato', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contato, {
      request: new Request('https://nandomoreira.dev/contato'),
    });
    expect(html).toContain('href="https://contrate.nandomoreira.dev/"');
  });

  it.each([
    ['http://localhost:4321/', 'http://contrate.nandomoreira.local:4321/'],
    ['http://nandomoreira.home/', 'http://contrate.nandomoreira.home/'],
  ])('links from %s to the sales host of that environment', async (from, to) => {
    const container = await AstroContainer.create();
    const home = await container.renderToString(Services, {
      props: { services: [], projects: [] },
      request: new Request(from),
    });
    const contato = await container.renderToString(Contato, { request: new Request(`${from}contato`) });
    expect(home).toContain(`href="${to}"`);
    expect(contato).toContain(`href="${to}"`);
  });
});
