import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Services from '../../src/components/home/Services.astro';
import Contato from '../../src/pages/contato.astro';

describe('entry points to the sales landing', () => {
  it('links from the home services section, without a second primary CTA', async () => {
    const html = await (await AstroContainer.create()).renderToString(Services, {
      props: { services: [], projects: [] },
    });
    expect(html).toContain('href="https://nandomoreira.dev/servicos"');
    expect(html).toContain('Para o seu negócio');
    expect(html).not.toContain('bg-primary');
  });

  it('links from /contato', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contato, {
      request: new Request('https://nandomoreira.dev/contato'),
    });
    expect(html).toContain('href="https://nandomoreira.dev/servicos"');
  });
});
