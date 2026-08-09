import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
import { websiteLd } from '../../src/lib/aeo/website-ld';

const site = new URL('https://nandomoreira.dev');

describe('websiteLd', () => {
  it('declares the WebSite type with the site url', () => {
    const ld = websiteLd(site, 'nandomoreira.dev');

    expect(ld['@type']).toBe('WebSite');
    expect(ld.url).toBe('https://nandomoreira.dev/');
  });

  it('declares the human-facing language', () => {
    expect(websiteLd(site, 'x').inLanguage).toBe('pt-BR');
  });
});

describe('BaseLayout structured data', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(BaseLayout, {
      props: { title: 'Título', description: 'Descrição' },
      slots: { default: '<p>x</p>' },
    });
  };

  it('embeds WebSite structured data on every page', async () => {
    expect(await render()).toContain('"WebSite"');
  });

  it('embeds parseable JSON', async () => {
    const html = await render();
    const match = html.match(
      /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
    );

    expect(match).not.toBeNull();
    expect(() => JSON.parse(match![1])).not.toThrow();
  });

  it('declares a canonical url', async () => {
    expect(await render()).toContain('rel="canonical"');
  });

  it('declares the minimum Open Graph metadata', async () => {
    const html = await render();

    for (const property of ['og:title', 'og:description', 'og:type', 'og:url']) {
      expect(html).toContain(property);
    }
  });
});
