import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { POLICY_UPDATED_AT, privacyMarkdown, privacySections } from '../../src/lib/privacy/policy';
import Privacidade from '../../src/pages/privacidade.astro';

const site = new URL('https://nandomoreira.dev');
const all = () => privacySections.flatMap((section) => [section.title, ...section.paragraphs]).join('\n');

describe('privacy policy content', () => {
  it('covers each topic a reader looks for', () => {
    const titles = privacySections.map((section) => section.id);
    expect(titles).toEqual([
      'responsavel',
      'nao-coletado',
      'registros',
      'formulario',
      'agentes',
      'compartilhamento',
      'direitos',
      'mudancas',
    ]);
  });

  it('states the retention the code enforces', () => {
    const text = all();
    expect(text).toContain('12 meses');
    expect(text).toContain('30 dias');
  });

  it('names every processor and where the data lives', () => {
    const text = all();
    for (const name of ['Google Cloud', 'Firestore', 'Resend', 'Estados Unidos', 'CodePen']) {
      expect(text).toContain(name);
    }
  });

  it('cites the LGPD legal bases and the rights', () => {
    const text = all();
    for (const reference of ['art. 7º, V', 'art. 7º, IX', 'art. 18', 'art. 33', 'ANPD']) {
      expect(text).toContain(reference);
    }
  });

  it('carries a last-updated date', () => {
    expect(POLICY_UPDATED_AT).toBe('2026-10-08');
  });
});

describe('/privacidade', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Privacidade, {});
  };

  it('renders every section as a heading with an anchor', async () => {
    const html = await render();
    for (const section of privacySections) {
      expect(html).toMatch(new RegExp(`<h2[^>]*id="${section.id}"`));
    }
  });

  it('offers the e-mail for rights requests to people', async () => {
    expect(await render()).toContain('mailto:oi@nandomoreira.dev');
  });

  it('shows the update date in pt-BR', async () => {
    expect(await render()).toContain('8 de outubro de 2026');
  });
});

describe('privacy in the site surfaces', () => {
  it('is linked from the footer', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteFooter, {
      props: { name: 'N', year: 2026, contacts: [] },
    });
    expect(html).toMatch(/<a[^>]*href="\/privacidade"[^>]*>[\s\S]*?Privacidade/);
  });

  it('has an AI view and markdown, without the e-mail', async () => {
    const page = await markdownForPath(site, 'privacidade');
    expect(page?.mdPath).toBe('/privacidade.md');
    expect(page?.markdown).toContain('# Política de privacidade');
    expect(page?.markdown).not.toContain('@');
    expect(privacyMarkdown({ site })).toContain('/contato');
  });

  it('is in the sitemap', () => {
    expect(buildSitemap({ site, projects: [] })).toContain('<loc>https://nandomoreira.dev/privacidade</loc>');
  });
});
