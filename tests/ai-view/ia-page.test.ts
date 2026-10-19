import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiBar from '../../src/components/ai-view/AiBar.astro';
import AiDocument from '../../src/components/ai-view/AiDocument.astro';
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

const renderBar = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(AiBar, {
    props: { humanPath: '/sobre', mdPath: '/sobre.md', ...props },
  });
};

const renderDocument = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(AiDocument, {
    props: {
      title: 'Sobre',
      url: 'https://nandomoreira.dev/sobre',
      markdown: '---\ntitle: Sobre\nurl: https://nandomoreira.dev/sobre\n---\n\n# Sobre\n\nBio.',
      ...props,
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
    expect(html).toContain('data-copy="ai-source"');
    expect(html).toMatch(/<code[^>]*id="ai-source"/);
    expect(html).toMatch(/href="\/sobre\.md"[^>]*download|download[^>]*href="\/sobre\.md"/);
    expect(html).toMatch(/href="\/sobre"[^>]*>[\s\S]*?Fechar|Fechar[\s\S]*?href="\/sobre"/);
  });

  it('offers the switcher back to the human page', async () => {
    const html = await renderPage('sobre');
    const nav = html.match(/<nav[^>]*aria-label="Visão da página"[\s\S]*?<\/nav>/)?.[0] ?? '';

    expect(nav).toContain('href="/sobre"');
    expect(nav).not.toContain('href="/sobre/ia"');
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

describe('AI view page chrome', () => {
  it('drops the human site header and puts the AI bar at the top', async () => {
    const html = await renderPage('sobre');
    expect(html).not.toContain('aria-label="Navegação principal"');
    const body = html.slice(html.indexOf('<body'));
    // The skip link stays first; the AI bar is the first landmark after it.
    expect(body.indexOf('data-ai-bar')).toBeLessThan(body.indexOf('<main'));
  });

  it('keeps the human header on human pages', () => {
    const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
    expect(layout).toContain('<SiteHeader');
    expect(layout).toContain('name="top"');
  });
});

describe('AiBar (top bar)', () => {
  it('ships radio tabs with Renderizado checked by default', async () => {
    const html = await renderBar();

    expect(html).toMatch(/<input[^>]*type="radio"[^>]*id="ai-tab-rendered"/);
    expect(html).toMatch(/<input[^>]*type="radio"[^>]*id="ai-tab-source"/);
    expect(html).toMatch(/id="ai-tab-rendered"[^>]*checked|checked[^>]*id="ai-tab-rendered"/);
    expect(html).toMatch(/<label[^>]*for="ai-tab-rendered"/);
    expect(html).toMatch(/<label[^>]*for="ai-tab-source"/);
  });

  it('leaves the tab colours to the stylesheet, so the chosen tab stays legible', async () => {
    const html = await renderBar();
    const labels = html.match(/<label[^>]*class="[^"]*"/g) ?? [];
    expect(labels.length).toBe(2);
    for (const label of labels) {
      expect(label).not.toMatch(/\btext-(muted-foreground|foreground|primary)\b/);
      expect(label).not.toMatch(/\bbg-/);
    }
  });

  it('shows the ready pill and the markdown path, like the reference bar', async () => {
    const html = await renderBar();
    expect(html).toContain(AI_VIEW_LABELS.ready);
    expect(html).toContain('/sobre.md');
    expect(html).not.toMatch(/aeo\.js/i);
  });

  it('keeps the Copy button hidden until the shared script reveals it', async () => {
    const html = await renderBar();

    expect(html).toMatch(/<button[^>]*data-copy="ai-source"[^>]*hidden|hidden[^>]*data-copy="ai-source"/);
    expect(html).toContain(AI_VIEW_LABELS.copy);
    expect(html).toContain(`data-label-copied="${AI_VIEW_LABELS.copied}"`);
  });

  it('exposes Baixar .md as a download link and Fechar as a human-page link', async () => {
    const html = await renderBar();

    expect(html).toMatch(/href="\/sobre\.md"[^>]*download|download[^>]*href="\/sobre\.md"/);
    expect(html).toContain(AI_VIEW_LABELS.download);
    expect(html).toMatch(/<a[^>]*href="\/sobre"[^>]*>[\s\S]*?Fechar/);
  });

  it('gives every control the same fixed height, so the bar reads as one row', async () => {
    const html = await renderBar();
    const controls = html.match(/<(p|label|button|a)\b[^>]*data-ai-control[^>]*>/g) ?? [];

    // Pill, path, two tabs, three actions.
    expect(controls).toHaveLength(7);
    for (const control of controls) {
      expect(control).toMatch(/\bh-11\b/);
      expect(control).not.toMatch(/\bmin-h-/);
    }
    // No padded wrapper around the tabs: that is what made the group taller.
    expect(html).not.toMatch(/<div[^>]*\bp-xs\b/);
  });

  it('decorates the actions with icons hidden from assistive technology', async () => {
    const html = await renderBar();
    expect((html.match(/<svg[^>]*aria-hidden="true"/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });
});

describe('AiDocument', () => {
  it('renders the markdown source and a server-rendered HTML panel', async () => {
    const html = await renderDocument();

    expect(html).toContain('data-ai-source');
    expect(html).toContain('# Sobre');
    expect(html).toContain('<h1');
  });

  it('fills the container instead of the 68ch reading measure', async () => {
    const html = await renderDocument();
    const panel = html.slice(html.indexOf('ai-panel-rendered'), html.indexOf('ai-panel-source'));
    expect(panel).not.toContain('max-w-[68ch]');
  });

  it('lets a long URL wrap, so the page never overflows a 320px screen', async () => {
    const html = await renderDocument({ url: 'https://nandomoreira.dev/portfolio/financial-normalization' });
    const link =
      html.match(/<a[^>]*href="https:\/\/nandomoreira\.dev\/portfolio\/financial-normalization"[^>]*>/)?.[0] ?? '';
    expect(link).toMatch(/\bbreak-all\b/);
  });

  it('wraps long words and URLs inside the rendered markdown', async () => {
    const html = await renderDocument({ markdown: '[repo](https://github.com/nandomoreirame/forja)' });
    expect(html).toMatch(/class="ai-panel-rendered[^"]*\bwrap-anywhere\b/);
  });
});
