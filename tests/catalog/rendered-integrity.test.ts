import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const privateRepoProject = {
  slug: 'cliente-x',
  title: 'Projeto de cliente',
  block: 'professional',
  summary: 'Plataforma interna',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['TypeScript'],
  repoUrl: null,
  liveUrl: 'https://cliente.example.com',
  featured: false,
  confidential: false,
};

const renderCase = async (project: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, { props: { project } });
};

describe('rendered catalogue integrity', () => {
  it('never emits an anchor with a null or empty href', async () => {
    const html = await renderCase(privateRepoProject);

    expect(html).not.toContain('href="null"');
    expect(html).not.toContain('href=""');
    expect(html).not.toContain('href="undefined"');
  });

  it('never sets an element to a fixed width that could overflow 320px', async () => {
    const html = await renderCase(privateRepoProject);
    expect(html).not.toMatch(/\bw-\[\d{3,}px\]/);
    expect(html).not.toMatch(/min-w-\[\d{3,}px\]/);
  });

  it('ships no client-side island in the catalogue', async () => {
    expect(await renderCase(privateRepoProject)).not.toContain('client:');
  });
});
