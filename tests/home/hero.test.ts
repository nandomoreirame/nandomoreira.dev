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

  it('offers exactly one primary call to action', async () => {
    const html = await render();
    expect(html.match(/bg-primary\b/g)).toHaveLength(1);
  });

  it('points the primary call to action at /mcp, "Esse site fala MCP"', async () => {
    const html = await render();
    const link = html.match(/<a\b[^>]*href="\/mcp"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('Esse site fala MCP');
    expect(link).toContain('bg-primary');
    expect(html).not.toContain('Ver o que eu construí');
  });

  it('closes the row with "Leia mais sobre mim", a transparent link-like button to /sobre', async () => {
    const html = await render();
    const row = html.slice(html.indexOf('href="/mcp"'));
    const link = html.match(/<a\b[^>]*href="\/sobre"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    expect(link).toContain('Leia mais sobre mim');
    expect(link).not.toContain('bg-primary');
    expect(link).not.toContain('border-border-strong');
    expect(row.indexOf('href="/contato"')).toBeLessThan(row.indexOf('href="/sobre"'));
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

  it('keeps the arrow only on "Leia mais sobre mim", never on the primary CTA', async () => {
    const html = await render();
    const mcp = html.match(/<a\b[^>]*href="\/mcp"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    const about = html.match(/<a\b[^>]*href="\/sobre"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(mcp).not.toContain('arrow-right');
    expect(about).toContain('arrow-right');
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
