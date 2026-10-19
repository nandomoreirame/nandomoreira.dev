import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/home/Hero.astro';

const render = async (
  props: Record<string, unknown> = {
    name: 'Fernando Moreira',
    headline: 'Engenheiro de produto com agentes de IA',
    positioning: 'Construo ferramental de agentes e produtos com IA em produção.',
  },
) => {
  const container = await AstroContainer.create();
  return container.renderToString(Hero, { props });
};

describe('Hero', () => {
  it('leaves availability to the header pill: no status dot in the hero', async () => {
    // The /mcp link came back on 2026-10-17 as the primary CTA, not as availability.
    const html = await render();
    expect(html).not.toContain('data-status-dot');
  });

  it('gives the text 200px above and 120px below on desktop, from spacing tokens', async () => {
    const html = await render();
    const section = html.match(/<section[^>]*id="inicio"[^>]*>/)?.[0] ?? '';
    expect(section).toMatch(/\blg:pt-hero-top\b/);
    expect(section).toMatch(/\blg:pb-hero-bottom\b/);
    expect(html.match(/<h1\b[^>]*>/)?.[0]).not.toContain('lg:mt-lg');

    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('--spacing-hero-top: 12.5rem;');
    expect(css).toContain('--spacing-hero-bottom: 7.5rem;');
  });

  it('shows the portrait beside the headline', async () => {
    expect(await render()).toMatch(/<img[^>]*alt="Ilustração de Fernando Moreira:/);
  });

  it('carries the only h1 of the page', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('states the AI and agents positioning', async () => {
    const html = await render();

    expect(html).toContain('agentes de IA');
    expect(html).toContain('produtos com IA em produção');
  });

  it('offers no call-to-action buttons: the palette hint, or on touch screens a link to /sobre', async () => {
    const html = await render();
    expect(html).not.toContain('href="/mcp"');
    expect(html).not.toContain('href="/contato"');
    // The one link: the touch-screen call to /sobre, inside its wrapper.
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toMatch(/<div[^>]*data-hero-about[^>]*>\s*<a\b[^>]*href="\/sobre"/);
    expect(html).toContain('data-palette-hint');
  });

  it('never animates the text in from invisible', async () => {
    const html = await render();

    expect(html).not.toContain('opacity-0');
    expect(html).not.toContain('animate-');
  });

  it('sets the headline in Newsreader at regular weight with tight tracking', async () => {
    const html = await render();
    const h1 = html.match(/<h1\b[^>]*>/)?.[0] ?? '';

    expect(h1).toContain('font-normal');
    expect(h1).toContain('tracking-tight');
    expect(h1).not.toContain('font-semibold');
  });

  it('sizes the positioning paragraph with the lead token', async () => {
    const html = await render();
    const paragraph = html.match(/<p\b[^>]*max-w-\[68ch\][^>]*>/)?.[0] ?? '';

    expect(paragraph).toContain('text-lead');
  });

  it('shows no STACK or LOCATION facts line', async () => {
    const html = await render();
    expect(html).not.toContain('data-hero-stack');
    expect(html).not.toContain('STACK:');
    expect(html).not.toContain('LOCATION:');
  });
});
