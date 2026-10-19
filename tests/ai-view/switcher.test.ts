import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AiSwitcher from '../../src/components/ai-view/AiSwitcher.astro';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
import { AI_VIEW_LABELS } from '../../src/lib/ai-view/labels';

const renderSwitcher = async (props: { humanPath: string; view: 'human' | 'ai' }) => {
  const container = await AstroContainer.create();
  return container.renderToString(AiSwitcher, { props });
};

const renderLayout = async (
  props: {
    noindex?: boolean;
    view?: 'human' | 'ai';
    canonicalPath?: string;
  } = {},
) => {
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

  it('shows only the way to the other view: IA on a human page', async () => {
    const html = await renderSwitcher({ humanPath: '/sobre', view: 'human' });

    expect(html.match(/<a\b/g) ?? []).toHaveLength(1);
    expect(html).toContain('href="/sobre/ia"');
    expect(html).not.toContain('href="/sobre"');
    expect(html).toContain(AI_VIEW_LABELS.ai);
    expect(html).not.toContain(AI_VIEW_LABELS.human);
    expect(html).toContain('data-icon="lucide:bot"');
  });

  it('shows only Humano on the AI view, back to the human page', async () => {
    const html = await renderSwitcher({ humanPath: '/sobre', view: 'ai' });

    expect(html.match(/<a\b/g) ?? []).toHaveLength(1);
    expect(html).toContain('href="/sobre"');
    expect(html).not.toContain('href="/sobre/ia"');
    expect(html).toContain(AI_VIEW_LABELS.human);
    expect(html).toContain('data-icon="lucide:user"');
  });

  it('never marks the link as current, since it always leads elsewhere', async () => {
    for (const view of ['human', 'ai'] as const) {
      expect(await renderSwitcher({ humanPath: '/sobre', view })).not.toContain('aria-current');
    }
  });

  it('uses touch targets of at least 44px and visible focus', async () => {
    const html = await renderSwitcher({ humanPath: '/', view: 'human' });

    expect(html).toContain('min-h-11');
    expect(html).toContain('focus-visible:outline-primary');
    expect(html).toContain('border-strong');
  });

  it('maps the home human path to /ia', async () => {
    expect(await renderSwitcher({ humanPath: '/', view: 'human' })).toContain('href="/ia"');
    expect(await renderSwitcher({ humanPath: '/', view: 'ai' })).toContain('href="/"');
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
    expect(html).toContain(AI_VIEW_LABELS.ai);
  });

  it('hides the switcher on a noindex page without an explicit view (404)', async () => {
    const html = await renderLayout({ noindex: true });

    expect(html).not.toContain('aria-label="Visão da página"');
  });

  it('keeps the switcher on a noindex AI view', async () => {
    const html = await renderLayout({ noindex: true, view: 'ai', canonicalPath: '/sobre' });

    expect(html).toContain('aria-label="Visão da página"');
    expect(html).toMatch(/<nav[^>]*aria-label="Visão da página"[\s\S]*?href="\/sobre"/);
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

describe('AiSwitcher compact labels', () => {
  const linkFor = (html: string, href: string) =>
    html.match(new RegExp(`<a[^>]*href="${href}"[\\s\\S]*?</a>`))?.[0] ?? '';

  it('reveals the label on hover or keyboard focus, never removing it for screen readers', async () => {
    for (const [view, label] of [
      ['human', AI_VIEW_LABELS.ai],
      ['ai', AI_VIEW_LABELS.human],
    ] as const) {
      const link = linkFor(await renderSwitcher({ humanPath: '/sobre', view }), '[^"]+');
      expect(link, label).toMatch(/<a[^>]*class="[^"]*\bgroup\/view\b/);
      const span = link.match(new RegExp(`<span[^>]*>${label}</span>`))?.[0] ?? '';
      expect(span, label).toMatch(/\bmax-w-0\b/);
      expect(span, label).toMatch(/\bopacity-0\b/);
      expect(span, label).toMatch(/\bgroup-hover\/view:opacity-100\b/);
      expect(span, label).toMatch(/\bgroup-focus-visible\/view:opacity-100\b/);
      expect(span, label).toMatch(/\btransition-/);
      expect(span, label).toMatch(/\btext-trim-cap\b/);
      const classes = span.match(/class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
      for (const removed of ['sr-only', 'hidden', 'invisible']) {
        expect(classes, label).not.toContain(removed);
      }
    }
  });
});
