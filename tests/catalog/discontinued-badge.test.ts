import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = (overrides: Record<string, unknown> = {}) => ({
  slug: 'atelie',
  title: 'Ateliê',
  block: 'professional',
  summary: 's',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['TypeScript'],
  featured: false,
  confidential: false,
  discontinued: false,
  date: '2025-04-01',
  repoUrl: null,
  liveUrl: null,
  ...overrides,
});

const render = async (overrides: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, { props: { project: project(overrides) } });
};

describe('discontinued case', () => {
  it('shows a badge where the live link would be', async () => {
    expect(await render({ discontinued: true })).toMatch(/descontinuado/i);
  });

  it('renders no outbound link, since the site is gone', async () => {
    const html = await render({ discontinued: true });

    // A dead link is worse than no link: it promises evidence and delivers a
    // connection error to whoever clicks it.
    expect(html).not.toMatch(/<a[^>]*target="_blank"/);
  });

  it('leaves a live case untouched', async () => {
    const html = await render({ liveUrl: 'https://example.com' });

    expect(html).not.toMatch(/descontinuado/i);
    expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com"/);
  });

  it('drops the link even when a stale URL is left in the frontmatter', async () => {
    // The flag wins over the field: forgetting to null the URL must not put a
    // dead link back on the page.
    const html = await render({ discontinued: true, liveUrl: 'https://gone.example' });

    expect(html).not.toContain('https://gone.example');
    expect(html).toMatch(/descontinuado/i);
  });
});
