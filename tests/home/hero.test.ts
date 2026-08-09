import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/home/Hero.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Hero, {
    props: {
      headline: 'Engenheiro de produto com agentes de IA',
      positioning: 'Construo ferramental de agentes e produtos com IA em produção.',
    },
  });
};

describe('Hero', () => {
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

  it('points the call to action at the catalogue', async () => {
    expect(await render()).toContain('href="/projetos"');
  });

  it('never animates the text in from invisible', async () => {
    const html = await render();

    expect(html).not.toContain('opacity-0');
    expect(html).not.toContain('animate-');
  });
});
