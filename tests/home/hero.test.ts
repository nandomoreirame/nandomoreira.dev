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
  it('leaves availability to the header pill: no MCP link and no status dot in the hero', async () => {
    const html = await render();
    expect(html).not.toContain('href="/mcp"');
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

  it('puts an arrow icon on the primary portfolio CTA', async () => {
    const html = await render();
    const link = html.match(/<a\b[^>]*href="\/portfolio"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toMatch(/lucide:arrow-right|data-icon="lucide:arrow-right"|arrow-right/);
  });

  it('borders the contact CTA as secondary', async () => {
    const html = await render();
    const link = html.match(/<a\b[^>]*href="\/contato"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toContain('border-border-strong');
  });

  it('shows the Stitch facts line: STACK in the accent, LOCATION in success', async () => {
    const line = (await render()).match(/<p[^>]*data-hero-stack[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';
    expect(line).toMatch(/<span class="text-primary">STACK:<\/span>\s*TS, Py, Rust, LLM ops/);
    expect(line).toMatch(/<span class="text-success">LOCATION:<\/span>\s*São Paulo \/ Remote/);
    expect(line).toContain('font-mono');
  });
});
