import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Index from '../../src/pages/index.astro';

// `projetos` gave way to one anchor per collection when the home stopped
// merging portfolio and lab into a single "Trabalho selecionado" section.
const EXPECTED_ANCHORS = [
  'inicio',
  'portfolio',
  'lab',
  'trajetoria',
  'servicos',
  'sobre',
  'contato',
];

const nav = readFileSync('src/components/layout/SiteNav.astro', 'utf8');

describe('section anchors', () => {
  // Assert on the rendered page, not on the component sources: CollectionSection
  // emits id={collection}, so grepping the source for id="portfolio" finds
  // nothing and the check would pass or fail for the wrong reason.
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Index, {});
  };

  it.each(EXPECTED_ANCHORS)('exposes a stable id for %s', async (anchor) => {
    expect(await render()).toContain(`id="${anchor}"`);
  });

  it('never links to a route that does not exist yet', () => {
    // Same trap, other direction: SiteNav builds hrefs from an array and emits
    // href={item.href}, so a source scan for href="/..." matched nothing and
    // could never fail. Assert on the array. The rendered equivalent lives in
    // tests/catalog/site-nav.test.ts.
    const items = nav.slice(nav.indexOf('const items'), nav.indexOf('---', 10));

    expect(items).not.toContain("href: '/agents'");
    expect(items).not.toContain("href: '/projetos'");
  });
});
