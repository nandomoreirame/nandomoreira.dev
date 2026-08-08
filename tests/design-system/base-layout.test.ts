import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(BaseLayout, {
    props: { title: 'Título', description: 'Descrição da página' },
    slots: { default: '<p>conteúdo</p>' },
  });
};

describe('BaseLayout', () => {
  it('declares the page language as Brazilian Portuguese', async () => {
    expect(await render()).toContain('lang="pt-BR"');
  });

  it('offers a skip link as the first focusable element', async () => {
    const html = await render();
    const skipIndex = html.indexOf('href="#main"');
    const mainIndex = html.indexOf('id="main"');

    expect(skipIndex).toBeGreaterThan(-1);
    expect(skipIndex).toBeLessThan(mainIndex);
  });

  it('exposes exactly one main landmark', async () => {
    const html = await render();
    expect(html.match(/<main[\s>]/g) ?? []).toHaveLength(1);
  });

  it('prevents horizontal overflow on the page body', async () => {
    expect(await render()).toContain('overflow-x-hidden');
  });

  it('caps the container width at the layout token', async () => {
    expect(await render()).toContain('max-w-(--container-page)');
  });
});
