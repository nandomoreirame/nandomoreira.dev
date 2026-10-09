import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/home/Hero.astro';

const render = async (
  props: Record<string, unknown> = {
    headline: 'Engenheiro de produto com agentes de IA',
    positioning: 'Construo ferramental de agentes e produtos com IA em produção.',
    availability: { status: 'open', detail: 'Aberto a consultoria.', updatedAt: '2026-08-08' },
  },
) => {
  const container = await AstroContainer.create();
  return container.renderToString(Hero, { props });
};

describe('Hero', () => {
  it('turns the availability label into the way in for agents, at /mcp', async () => {
    const html = await render();
    const link = html.match(/<a\b[^>]*href="\/mcp"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('Disponível para novos projetos');
    expect(link).toContain('min-h-11');
  });

  it('carries the only h1 of the page', async () => {
    expect((await render()).match(/<h1/g)).toHaveLength(1);
  });

  it('states the AI and agents positioning', async () => {
    const html = await render();

    expect(html).toContain('agentes de IA');
    expect(html).toContain('produtos com IA em produção');
  });

  it('offers exactly one primary call to action', async () => {
    const html = await render();
    expect(html.match(/bg-primary\b/g)).toHaveLength(1);
  });

  it('points the call to action at the portfolio listing', async () => {
    expect(await render()).toContain('href="/portfolio"');
  });

  it('never animates the text in from invisible', async () => {
    const html = await render();

    expect(html).not.toContain('opacity-0');
    expect(html).not.toContain('animate-');
  });

  it('shows availability as a visual marker accompanied by a text label', async () => {
    const html = await render();

    expect(html).toMatch(/dispon[ií]vel/i);
    // Colour alone is forbidden: the status text must be present.
    expect(html).toMatch(/bg-success|text-success|rounded-full/);
  });
});
