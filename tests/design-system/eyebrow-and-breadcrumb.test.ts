import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CaseArticle from '../../src/components/catalog/CaseArticle.astro';
import SobrePage from '../../src/pages/sobre.astro';

const project = {
  slug: 'forja',
  title: 'Forja',
  block: 'ai-tooling',
  summary: 'Cliente GUI multi-CLI',
  problem: 'p',
  decisions: 'd',
  outcome: 'o',
  tech: ['Rust'],
  repoUrl: 'https://github.com/x/forja',
  liveUrl: null,
  featured: true,
  confidential: false,
};

const render = async (Component: unknown, props?: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(Component as never, props ? { props } : undefined);
};

/** Opening tag of the page path, or of the case category label. */
const tagAt = (html: string, marker: string) => {
  const article = html.indexOf('<article');
  const hit = html.indexOf(marker, article);

  expect(hit, `no ${marker} inside <article>`).toBeGreaterThan(article);

  const tagStart = html.lastIndexOf('<', hit);
  return html.slice(tagStart, html.indexOf('</p>', hit) + 4);
};

describe('eyebrow', () => {
  it('names /sobre as a terminal path and keeps the case category in muted caps', async () => {
    const [about, tumodori] = await Promise.all([
      render(SobrePage),
      render(CaseArticle, { project }),
    ]);

    const path = tagAt(about, 'data-page-path');
    expect(path).toContain('~/sobre');
    expect(path).toContain('font-mono');
    expect(path).toContain('text-small');
    expect(path).toContain('text-muted-foreground');
    expect(path).not.toContain('uppercase');

    // The case category is a label, not the page path: it stays small mono caps.
    const category = tagAt(tumodori, 'tracking-eyebrow');
    expect(category).toContain('font-mono');
    expect(category).toContain('text-small');
    expect(category).toContain('uppercase');
    expect(category).toContain('tracking-eyebrow');
    expect(category).toContain('text-muted-foreground');
    expect(category).not.toContain('text-primary');
  });
});

describe('footer separation', () => {
  it('keeps air between the last content and the footer rule', async () => {
    // The listing pages carry no bottom margin, so without this the last row
    // sat directly on the footer border and read as part of the list.
    const source = readFileSync('src/components/layout/SiteFooter.astro', 'utf8');
    // Matched on the tag that carries a class: the file's own comment mentions
    // `<footer>` in prose, and a plain indexOf finds that first.
    const openTag = /<footer\s+class="([^"]*)"/.exec(source);

    expect(openTag, 'no <footer> with a class attribute').not.toBeNull();
    expect(openTag![1]).toMatch(/\bmt-(xl|2xl|3xl)\b/);
  });
});

describe('back link', () => {
  it('is quiet mono text, never an underlined accent link', async () => {
    // The breadcrumb is orientation, not a call to action. Rendered in the
    // accent colour with an underline it outweighed the case title above it.
    const offenders: string[] = [];

    for await (const file of glob('src/pages/**/*.astro')) {
      const text = readFileSync(file, 'utf8');
      const nav = text.indexOf('aria-label="Trilha de navegação"');
      if (nav === -1) continue;

      const anchor = text.slice(nav, text.indexOf('</a>', nav));
      if (/text-primary|underline/.test(anchor)) {
        offenders.push(file.replaceAll('\\', '/'));
      }
    }

    expect(offenders).toEqual([]);
  });

  it('keeps a 44px target and a visible hover, so quiet is not unreachable', async () => {
    const html = await render(SobrePage);
    void html;

    for await (const file of glob('src/pages/**/*.astro')) {
      const text = readFileSync(file, 'utf8');
      const nav = text.indexOf('aria-label="Trilha de navegação"');
      if (nav === -1) continue;

      const anchor = text.slice(nav, text.indexOf('</a>', nav));

      expect(anchor, `${file} lost its touch target`).toMatch(/min-h-11/);
      expect(anchor, `${file} has no hover affordance`).toMatch(/hover:/);
    }
  });
});
