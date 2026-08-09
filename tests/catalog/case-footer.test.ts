import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI',
  problem: 'O PROBLEMA',
  decisions: 'AS DECISOES',
  outcome: 'O RESULTADO',
  tech: ['Rust', 'Tauri'],
  repoUrl: 'https://github.com/x/forja',
  liveUrl: 'https://forja.example.com',
  featured: true,
  confidential: false,
};

const render = async (overrides: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(CaseArticle, {
    props: { project: { ...project, ...overrides } },
  });
};

describe('CaseArticle footer', () => {
  it('places links and tech tags below the case content, not in the header', async () => {
    const html = await render();

    // Both must come after the last prose section, so the reader reaches the
    // evidence at the end of the case instead of before reading it.
    expect(html.indexOf('O RESULTADO')).toBeLessThan(html.indexOf('Ver projeto'));
    expect(html.indexOf('O RESULTADO')).toBeLessThan(html.indexOf('Rust'));
    expect(html.indexOf('<footer')).toBeGreaterThan(html.indexOf('O RESULTADO'));
  });

  it('lays links and tags on one row, links left and tags right', async () => {
    const html = await render();
    const footer = html.slice(html.indexOf('<footer'));

    // justify-between puts the two groups at opposite ends; items-center keeps
    // a tall button and a short badge on the same baseline.
    expect(footer).toMatch(/<footer[^>]*class="[^"]*flex[^"]*"/);
    expect(footer).toMatch(/<footer[^>]*class="[^"]*items-center[^"]*"/);
    expect(footer).toMatch(/<footer[^>]*class="[^"]*justify-between[^"]*"/);

    // DOM order is the horizontal order: the link group precedes the tag list.
    expect(footer.indexOf('Ver projeto')).toBeLessThan(footer.indexOf('Rust'));
  });

  it('keeps the tag list right-aligned when the row wraps on narrow screens', async () => {
    const html = await render();
    const footer = html.slice(html.indexOf('<footer'));

    // Anchored to the <ul> itself: slicing from the first <ul> would also match
    // the link list, which carries no alignment of its own.
    expect(footer).toMatch(/<ul[^>]*class="[^"]*justify-end[^"]*"/);
  });

  it('still shows the tags when a discontinued case has no links', async () => {
    const html = await render({ discontinued: true, liveUrl: null, repoUrl: null });
    const footer = html.slice(html.indexOf('<footer'));

    expect(footer).toContain('Rust');
    expect(footer).not.toContain('Ver projeto');
  });

  it('puts the discontinued badge beside the title, never in the footer', async () => {
    const html = await render({ discontinued: true, liveUrl: null, repoUrl: null });
    const footer = html.slice(html.indexOf('<footer'));

    // The badge qualifies the case, so it belongs where the reader meets the
    // name, not at the end next to the evidence that no longer exists.
    expect(html.indexOf('Descontinuado')).toBeGreaterThan(html.indexOf('<h1'));
    expect(html.indexOf('Descontinuado')).toBeLessThan(html.indexOf('O PROBLEMA'));
    expect(footer).not.toContain('Descontinuado');

    // Title and badge share one row, badge to the right of the title. Anchored
    // to the opening tag itself: slicing to the end of the document would match
    // the items-center of the footer and pass with the row unstyled.
    const start = html.lastIndexOf('<div', html.indexOf('<h1'));
    const openTag = html.slice(start, html.indexOf('>', start) + 1);

    expect(openTag).toMatch(/class="[^"]*items-center[^"]*"/);
    expect(html.indexOf('Forja')).toBeLessThan(html.indexOf('Descontinuado'));
  });

  it('still shows the tags when a confidential case has no public evidence', async () => {
    const html = await render({ confidential: true, liveUrl: null, repoUrl: null });
    const footer = html.slice(html.indexOf('<footer'));

    expect(footer).toMatch(/confidencialidade/i);
    expect(footer).toContain('Tauri');
  });
});
