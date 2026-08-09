import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = {
  slug: 'pipeline',
  title: 'Pipeline',
  block: 'professional',
  summary: 's',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['Python'],
  featured: false,
  confidential: true,
  date: '2026-01-01',
  repoUrl: null,
  liveUrl: null,
};

describe('confidential case with no link', () => {
  it('states that the evidence is not public', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CaseArticle, { props: { project } });

    // Without this the relaxation silently turns "verifiable evidence" into
    // "the author says so", which is what the catalogue exists to prevent.
    expect(html).toMatch(/confidencialidade|não é pública/i);
  });

  it('does not render an empty link area', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CaseArticle, { props: { project } });
    expect(html).not.toMatch(/<a[^>]*href="(null|undefined|#)"/);
  });
});
