import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string, live = true) =>
  (await AstroContainer.create()).renderToString(SalesLayout, {
    props: { title: 'T', description: 'D', locale, live, slug: locale === 'en' ? 'website' : 'site-institucional' },
    slots: { default: '<p>x</p>' },
  });
describe('SalesLayout language and alternates', () => {
  it('uses English chrome, canonical, OG and Service JSON-LD', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('rel="canonical" href="https://contrate.nandomoreira.dev/en/website"');
    expect(html).toContain('hreflang="pt-BR" href="https://contrate.nandomoreira.dev/site-institucional"');
    expect(html).toContain('hreflang="x-default" href="https://contrate.nandomoreira.dev/site-institucional"');
    expect(html).toContain('content="en_US"');
    expect(html).toContain('"inLanguage":"en"');
    expect(html).toContain('"name":"Brasil"');
    expect(html).toContain('/og/en/services/website.png');
    expect(html).toMatch(/<a[^>]*href="\/site-institucional"[^>]*hreflang="pt-BR"/);
    expect(ptLeftovers(html)).toEqual([]);
  });
  it('emits reciprocal Portuguese alternates only while English is published', async () => {
    expect(await render('pt-BR')).toContain('hreflang="en" href="https://contrate.nandomoreira.dev/en/website"');
    const off = await render('pt-BR', false);
    expect(off).not.toContain('hreflang=');
    expect(off).not.toContain('data-language-switch');
    expect(off).not.toContain('og:locale:alternate');
  });
});

describe('SalesLayout switch while the sales host is in rollback', () => {
  it('points the language switch at the internal paths', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SalesLayout, {
      props: {
        title: 'T',
        description: 'D',
        locale: 'pt-BR',
        live: true,
        salesLive: false,
        slug: 'site-institucional',
      },
      slots: { default: '<p>x</p>' },
    });
    expect(html).toMatch(/<a[^>]*href="\/en\/services\/website"[^>]*hreflang="en"/);
  });
});
