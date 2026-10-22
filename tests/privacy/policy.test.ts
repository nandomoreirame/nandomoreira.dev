import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { POLICY_UPDATED_AT, privacyMarkdown, privacySections } from '../../src/lib/privacy/policy';
import Privacidade from '../../src/pages/privacidade.astro';

const site = new URL('https://nandomoreira.dev');
const all = () => privacySections.flatMap(section => [section.title, ...section.paragraphs]).join('\n');

describe('privacy policy content', () => {
  it('covers each topic a reader looks for', () => {
    const titles = privacySections.map(section => section.id);
    expect(titles).toEqual([
      'responsavel',
      'nao-coletado',
      'medicao',
      'registros',
      'formulario',
      'curriculo',
      'novidades',
      'agentes',
      'comentarios',
      'compartilhamento',
      'direitos',
      'mudancas',
    ]);
  });

  it('explains the optional details before the CV download, and what skipping still records', () => {
    const section = privacySections.find(candidate => candidate.id === 'curriculo');
    const text = [section?.title, ...(section?.paragraphs ?? [])].join('\n');
    expect(text).toMatch(/opcion(al|ais)/);
    expect(text).toContain('12 meses');
    expect(text).toMatch(/[Nn]ão guardo o IP/);
    expect(text).toMatch(/nome, empresa e e-mail/);
    // Every download goes through /go/curriculo and counts in the visit measurement.
    expect(text).toContain('/go/curriculo');
    expect(text).not.toMatch(/nem um registro anônimo do download/);
  });

  it('describes a single contact form, the one the services pages lead to', () => {
    const text = (privacySections.find(candidate => candidate.id === 'formulario')?.paragraphs ?? []).join('\n');
    expect(text).not.toMatch(/formulários de contato e de serviços/);
    expect(text).toMatch(/página de serviços leva/);
  });

  it('mentions the automatic confirmation sent to the e-mail the visitor gave', () => {
    for (const id of ['formulario', 'curriculo']) {
      const section = privacySections.find(candidate => candidate.id === id);
      const text = (section?.paragraphs ?? []).join('\n');
      expect(text, id).toMatch(/confirmação automática/);
      expect(text, id).toMatch(/primeiro nome/);
    }
  });

  it('says the newsletter signup sends a confirmation and tells me', () => {
    const section = privacySections.find(candidate => candidate.id === 'novidades');
    const text = (section?.paragraphs ?? []).join('\n');
    expect(text).toMatch(/confirmação automática/);
    expect(text).toMatch(/aviso/);
  });

  it('states the retention the code enforces', () => {
    const text = all();
    expect(text).toContain('12 meses');
    expect(text).toContain('30 dias');
  });

  it('names every processor and where the data lives', () => {
    const text = all();
    for (const name of ['Google Cloud', 'Firestore', 'Resend', 'Estados Unidos', 'CodePen', 'GitHub']) {
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
    expect(POLICY_UPDATED_AT).toBe('2026-10-22');
  });

  it('describes the visit measurement honestly', () => {
    const section = privacySections.find(candidate => candidate.id === 'medicao');
    const text = [section?.title, ...(section?.paragraphs ?? [])].join('\n');
    for (const fact of [
      'sem nenhum script',
      'sem cookie',
      'IP não é gravado',
      'muda todo dia',
      '30 dias',
      '24 meses',
      'art. 7º, IX',
      '/go/',
      'utm_source',
    ]) {
      expect(text).toContain(fact);
    }
  });

  it("never says the counting cannot identify anyone, since the journey joins a lead's name", () => {
    const section = privacySections.find(candidate => candidate.id === 'nao-coletado');
    const text = (section?.paragraphs ?? []).join('\n');

    expect(text).not.toMatch(/nada nela identifica/);
    expect(text).toMatch(/formulário|currículo/);
  });

  it('says the city and state are approximate and kept only for 30 days', () => {
    const section = privacySections.find(candidate => candidate.id === 'medicao');
    const text = (section?.paragraphs ?? []).join('\n');
    expect(text).toMatch(/cidade e o estado aproximados/);
    expect(text).toMatch(/só no registro de cada visita/);
  });

  it('explains that comments use a GitHub account and stay public on Discussions', () => {
    const section = privacySections.find(candidate => candidate.id === 'comentarios');
    const text = [section?.title, ...(section?.paragraphs ?? [])].join('\n');
    for (const fact of ['Giscus', 'conta do GitHub', 'GitHub Discussions', 'públic']) {
      expect(text).toContain(fact);
    }
    const link = section?.links?.find(
      item => item.href === 'https://docs.github.com/pt/site-policy/privacy-policies/github-privacy-statement',
    );
    expect(link?.phrase).toBe('política de privacidade do GitHub');
    expect(text).toContain(link?.phrase);
    const share = (privacySections.find(candidate => candidate.id === 'compartilhamento')?.paragraphs ?? []).join('\n');
    expect(share).toContain('GitHub');
    expect(share).toContain('Giscus');
    expect(share).toContain('giscus.app/client.js');
    expect(share).toMatch(/metadados da conexão/);
    expect(share).toMatch(/endereço IP/);
    expect(share).toContain('GitHub Discussions');
    expect(share).not.toMatch(/recebe só/);
    expect(all()).not.toMatch(/o único script/);
  });

  it('no longer claims there is no measurement', () => {
    expect(all()).not.toMatch(/não usa cookies, analytics/);
    expect(all()).not.toMatch(/não guardam nada sobre quem consulta/);
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
    expect(await render()).toContain('22 de outubro de 2026');
  });

  it('renders the GitHub privacy statement as a link', async () => {
    const html = await render();
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/docs\.github\.com\/pt\/site-policy\/privacy-policies\/github-privacy-statement"[^>]*>política de privacidade do GitHub<\/a>/,
    );
  });
});

describe('privacy in the site surfaces', () => {
  it('is linked from the footer', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SiteFooter, {
      props: { name: 'N', year: 2026, contacts: [], version: 'v17.1' },
    });
    expect(html).toMatch(/<a[^>]*href="\/privacidade"[^>]*>[\s\S]*?Privacidade/);
  });

  it('has an AI view and markdown, without the e-mail', async () => {
    const page = await markdownForPath(site, 'privacidade');
    expect(page?.mdPath).toBe('/privacidade.md');
    expect(page?.markdown).toContain('# Política de privacidade');
    expect(page?.markdown).not.toContain('@');
    expect(privacyMarkdown({ site })).toContain('/contato');
    const markdown = privacyMarkdown({ site });
    expect(markdown).toContain('Giscus');
    expect(markdown).toContain('conta do GitHub');
    expect(markdown).toContain('GitHub Discussions');
    expect(markdown).toContain(
      'Quem trata o comentário publicado é o GitHub, nos termos da [política de privacidade do GitHub](https://docs.github.com/pt/site-policy/privacy-policies/github-privacy-statement). Eu modero as conversas por lá.',
    );
    expect(markdown).toContain('Este site é pessoal. O responsável pelos dados');
    expect(markdown).toContain('giscus.app/client.js');
    expect(markdown).toMatch(/metadados da conexão/);
  });

  it('is in the sitemap', () => {
    expect(buildSitemap({ site, projects: [] })).toContain('<loc>https://nandomoreira.dev/privacidade</loc>');
  });
});
