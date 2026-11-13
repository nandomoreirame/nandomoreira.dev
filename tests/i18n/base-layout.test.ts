import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async (url: string, props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    request: new Request(url),
    props: { title: 'T', description: 'D', ...props },
    slots: { default: '<p>x</p>' },
  });
};

const pair = { 'pt-BR': '/sobre', en: '/en/about' };

describe('BaseLayout language', () => {
  it('stays pt-BR at the root, with no reciprocal hreflang when there is no pair', async () => {
    // /releases has no English counterpart (D14). The switch still appears
    // (EN_LIVE) with a fallback href, but the head has no reciprocal pair.
    const html = await render('https://nandomoreira.dev/releases');
    expect(html).toContain('<html lang="pt-BR"');
    expect(html).toContain('content="pt_BR"');
    expect(html).not.toContain('rel="alternate" hreflang=');
    expect(html).not.toContain('og:locale:alternate');
    expect(html).toContain('data-language-switch');
    expect(html).toContain('Pular para o conteúdo');
    expect(html).toContain('"inLanguage":"pt-BR"');
  });

  it('switches to English under /en', async () => {
    const html = await render('https://nandomoreira.dev/en/about', { alternates: pair });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('property="og:locale" content="en_US"');
    expect(html).toContain('property="og:locale:alternate" content="pt_BR"');
    expect(html).toContain('Skip to content');
    expect(html).toContain('"inLanguage":"en"');
    expect(html).toContain('href="/en/rss.xml"');
  });

  it('emits reciprocal hreflang with x-default on pt-BR (REQ-011)', async () => {
    const html = await render('https://nandomoreira.dev/sobre', { alternates: pair });
    expect(html).toContain('<link rel="alternate" hreflang="pt-BR" href="https://nandomoreira.dev/sobre"');
    expect(html).toContain('<link rel="alternate" hreflang="en" href="https://nandomoreira.dev/en/about"');
    expect(html).toContain('<link rel="alternate" hreflang="x-default" href="https://nandomoreira.dev/sobre"');
  });
});
