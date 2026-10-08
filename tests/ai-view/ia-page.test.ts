import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiBar from '../../src/components/ai-view/AiBar.astro';
import { AI_VIEW_LABELS } from '../../src/lib/ai-view/labels';
import IaPage from '../../src/pages/[...path]/ia.astro';

const pageSource = readFileSync('src/pages/[...path]/ia.astro', 'utf8');
const barSource = readFileSync('src/components/ai-view/AiBar.astro', 'utf8');

const renderPage = async (path: string | undefined) => {
  const container = await AstroContainer.create();
  return container.renderToString(IaPage, {
    params: { path },
  });
};

const renderBar = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(AiBar, {
    props: {
      title: 'Sobre',
      url: 'https://nandomoreira.dev/sobre',
      humanPath: '/sobre',
      mdPath: '/sobre.md',
      markdown: '---\ntitle: Sobre\nurl: https://nandomoreira.dev/sobre\n---\n\n# Sobre\n\nBio.',
    },
  });
};

describe('/[...path]/ia page', () => {
  it('opts out of prerendering', () => {
    expect(pageSource).toContain('prerender = false');
  });

  it('returns 404 when the registry does not know the path', async () => {
    expect(pageSource).toContain('Astro.response.status = 404');
    const html = await renderPage('nao-existe');
    expect(html).toMatch(/not found/i);
    expect(html).not.toContain('aria-label="Visão da página"');
  });

  it('renders the AI view for /sobre/ia with noindex and human canonical', async () => {
    const html = await renderPage('sobre');

    expect(html).toContain('name="robots" content="noindex"');
    expect(html).toContain('rel="canonical" href="https://nandomoreira.dev/sobre"');
    expect(html).toContain(AI_VIEW_LABELS.ready);
    expect(html).toContain('/sobre.md');
    expect(html).toContain(AI_VIEW_LABELS.rendered);
    expect(html).toContain(AI_VIEW_LABELS.source);
    expect(html).toContain(AI_VIEW_LABELS.download);
    expect(html).toContain(AI_VIEW_LABELS.close);
    expect(html).toContain('data-ai-source');
    expect(html).toContain('data-ai-copy');
    expect(html).toMatch(/href="\/sobre\.md"[^>]*download|download[^>]*href="\/sobre\.md"/);
    expect(html).toMatch(/href="\/sobre"[^>]*>[\s\S]*?Fechar|Fechar[\s\S]*?href="\/sobre"/);
  });

  it('marks the IA side of the switcher as current', async () => {
    const html = await renderPage('sobre');

    expect(html).toMatch(
      /href="\/sobre\/ia"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/sobre\/ia"/,
    );
  });

  it('renders the home AI view at /ia', async () => {
    const html = await renderPage(undefined);

    expect(html).toContain(AI_VIEW_LABELS.ready);
    expect(html).toContain('/index.md');
    expect(html).toContain('rel="canonical" href="https://nandomoreira.dev/"');
  });

  it('uses no client directive and no new script tag', () => {
    expect(pageSource).not.toContain('client:');
    expect(pageSource).not.toContain('<script');
    expect(barSource).not.toContain('client:');
    expect(barSource).not.toContain('<script');
  });
});

describe('AiBar', () => {
  it('ships radio tabs with Renderizado checked by default', async () => {
    const html = await renderBar();

    expect(html).toMatch(/<input[^>]*type="radio"[^>]*id="ai-tab-rendered"/);
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*id="ai-tab-source"/);
    expect(html).toMatch(/id="ai-tab-rendered"[^>]*checked|checked[^>]*id="ai-tab-rendered"/);
    expect(html).toMatch(/<label[^>]*for="ai-tab-rendered"/);
    expect(html).toMatch(/<label[^>]*for="ai-tab-source"/);
  });

  it('keeps the Copy button hidden until the shared script reveals it', async () => {
    const html = await renderBar();

    expect(html).toMatch(/<button[^>]*data-ai-copy[^>]*hidden|hidden[^>]*data-ai-copy/);
    expect(html).toContain(AI_VIEW_LABELS.copy);
  });

  it('renders the markdown source and a server-rendered HTML panel', async () => {
    const html = await renderBar();

    expect(html).toContain('data-ai-source');
    expect(html).toContain('# Sobre');
    expect(html).toContain('<h1');
  });

  it('exposes Baixar .md as a download link and Fechar as a human-page link', async () => {
    const html = await renderBar();

    expect(html).toMatch(/href="\/sobre\.md"[^>]*download|download[^>]*href="\/sobre\.md"/);
    expect(html).toContain(AI_VIEW_LABELS.download);
    expect(html).toContain(`>${AI_VIEW_LABELS.close}<`);
  });
});
