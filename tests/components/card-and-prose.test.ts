import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ProjectCard from '../../src/components/ui/ProjectCard.astro';
import Prose from '../../src/components/ui/Prose.astro';

const base = {
  slug: 'forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  tech: ['Rust', 'Tauri'],
};

const renderCard = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ProjectCard, { props: { ...base, ...props } });
};

describe('ProjectCard', () => {
  it('links the whole card to the case page', async () => {
    expect(await renderCard()).toContain('href="/projetos/forja"');
  });

  it('shows the deterministic fallback when there is no image', async () => {
    const html = await renderCard({ image: undefined });
    expect(html).toContain('FO');
    expect(html).not.toContain('<img');
  });

  it('shows the image when there is one', async () => {
    const html = await renderCard({
      image: { src: '/img/forja.png', alt: 'Tela do Forja' },
    });
    expect(html).toContain('<img');
    expect(html).toContain('alt="Tela do Forja"');
  });

  it('delimits its interactive surface with a perceivable border, not #262626', async () => {
    const html = await renderCard();
    expect(html).toContain('hover:border-border-strong');
  });

  it('exposes a visible focus ring, since the card is a link', async () => {
    expect(await renderCard()).toContain('focus-visible:outline-primary');
  });
});

describe('Prose', () => {
  it('caps the measure so long-form case text stays readable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, {
      slots: { default: '<p>texto</p>' },
    });

    expect(html).toContain('max-w-[68ch]');
  });
});
