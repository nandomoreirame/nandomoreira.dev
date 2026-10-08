import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiSwitcher from '../../src/components/ai-view/AiSwitcher.astro';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
import { AI_VIEW_LABELS } from '../../src/lib/ai-view/labels';

const renderSwitcher = async (props: {
  humanPath: string;
  view: 'human' | 'ai';
}) => {
  const container = await AstroContainer.create();
  return container.renderToString(AiSwitcher, { props });
};

const renderLayout = async (props: {
  noindex?: boolean;
  view?: 'human' | 'ai';
  canonicalPath?: string;
} = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: {
      title: 'Título',
      description: 'Descrição',
      ...props,
    },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('AI_VIEW_LABELS', () => {
  it('exposes the pt-BR labels used by the switcher and bar', () => {
    expect(AI_VIEW_LABELS).toEqual({
      human: 'Humano',
      ai: 'IA',
      ready: 'Pronto para LLM',
      rendered: 'Renderizado',
      source: 'Fonte',
      copy: 'Copiar',
      copied: 'Copiado',
      download: 'Baixar .md',
      close: 'Fechar',
      title: 'Título',
      url: 'URL',
    });
  });
});

describe('AiSwitcher', () => {
  it('is a nav landmark labelled Visão da página', async () => {
    const html = await renderSwitcher({ humanPath: '/sobre', view: 'human' });

    expect(html).toMatch(/<nav[^>]*aria-label="Visão da página"/);
  });

  it('links Humano to the human page and IA to the /ia view', async () => {
    const html = await renderSwitcher({ humanPath: '/sobre', view: 'human' });

    expect(html).toContain('href="/sobre"');
    expect(html).toContain('href="/sobre/ia"');
    expect(html).toContain(AI_VIEW_LABELS.human);
    expect(html).toContain(AI_VIEW_LABELS.ai);
  });

  it('marks the current view with aria-current="page"', async () => {
    const human = await renderSwitcher({ humanPath: '/sobre', view: 'human' });
    expect(human).toMatch(
      new RegExp(
        `href="/sobre"[^>]*aria-current="page"|aria-current="page"[^>]*href="/sobre"`,
      ),
    );
    expect(human).not.toMatch(/href="\/sobre\/ia"[^>]*aria-current/);

    const ai = await renderSwitcher({ humanPath: '/sobre', view: 'ai' });
    expect(ai).toMatch(
      new RegExp(
        `href="/sobre/ia"[^>]*aria-current="page"|aria-current="page"[^>]*href="/sobre/ia"`,
      ),
    );
  });

  it('uses touch targets of at least 44px and visible focus', async () => {
    const html = await renderSwitcher({ humanPath: '/', view: 'human' });

    expect(html).toContain('min-h-11');
    expect(html).toContain('focus-visible:outline-primary');
    expect(html).toContain('border-strong');
  });

  it('maps the home human path to /ia', async () => {
    const html = await renderSwitcher({ humanPath: '/', view: 'human' });

    expect(html).toContain('href="/"');
    expect(html).toContain('href="/ia"');
  });

  it('uses no client directive and no script', async () => {
    const source = readFileSync('src/components/ai-view/AiSwitcher.astro', 'utf8');
    expect(source).not.toContain('client:');
    expect(source).not.toContain('<script');
  });
});

describe('BaseLayout switcher integration', () => {
  it('renders the switcher on a normal page', async () => {
    const html = await renderLayout();

    expect(html).toContain('aria-label="Visão da página"');
    expect(html).toContain(AI_VIEW_LABELS.human);
  });

  it('hides the switcher on a noindex page without an explicit view (404)', async () => {
    const html = await renderLayout({ noindex: true });

    expect(html).not.toContain('aria-label="Visão da página"');
  });

  it('keeps the switcher on a noindex AI view', async () => {
    const html = await renderLayout({ noindex: true, view: 'ai', canonicalPath: '/sobre' });

    expect(html).toContain('aria-label="Visão da página"');
    expect(html).toMatch(/href="\/sobre\/ia"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/sobre\/ia"/);
  });

  it('uses canonicalPath for the canonical link when given', async () => {
    const html = await renderLayout({
      noindex: true,
      view: 'ai',
      canonicalPath: '/sobre',
    });

    expect(html).toContain('rel="canonical" href="https://nandomoreira.dev/sobre"');
  });
});
