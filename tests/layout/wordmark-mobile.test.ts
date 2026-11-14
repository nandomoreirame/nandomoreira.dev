import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Wordmark from '../../src/components/layout/Wordmark.astro';

const render = async () =>
  (await AstroContainer.create()).renderToString(Wordmark, { props: { name: 'nandomoreira.dev', accent: 'moreira' } });

describe('Wordmark on mobile', () => {
  it('shows ndm.dev below md, with only the m in the accent colour', async () => {
    const html = await render();
    expect(html).toMatch(/<span class="md:hidden">nd<span class="text-primary">m<\/span>\.dev<\/span>/);
  });

  it('keeps the full brand from md up', async () => {
    const html = await render();
    expect(html).toMatch(/<span class="max-md:hidden">nando<span class="text-primary">moreira<\/span>\.dev<\/span>/);
  });
});
