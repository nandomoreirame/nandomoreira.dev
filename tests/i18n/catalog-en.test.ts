import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CasePage from '../../src/components/pages/CasePage.astro';
import CollectionPage from '../../src/components/pages/CollectionPage.astro';
import { closingCta } from '../../src/lib/catalog/closing-cta';
import { collectionCopy } from '../../src/lib/catalog/collection-copy';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects } from '../../src/lib/content';
import { ptLeftovers } from '../helpers/pt-leftovers';

const renderCollection = async (collection: 'portfolio' | 'lab', locale: string) =>
  (await AstroContainer.create()).renderToString(CollectionPage, {
    props: { collection, locale },
    request: new Request(
      locale === 'en' ? `https://nandomoreira.dev/en/${collection}` : `https://nandomoreira.dev/${collection}`,
    ),
  });

describe('catalog copy by locale', () => {
  it('keeps pt-BR and adds English', () => {
    expect(collectionCopy('portfolio', 'pt-BR').title).toBe('Produtos e trabalho de cliente, do problema à produção');
    expect(ptLeftovers(`<p>${Object.values(collectionCopy('lab', 'en')).join(' ')}</p>`)).toEqual([]);
    expect(ptLeftovers(`<p>${Object.values(closingCta('portfolio', 'en')).join(' ')}</p>`)).toEqual([]);
  });
});

describe('English collection pages', () => {
  it.each(['portfolio', 'lab'] as const)('%s renders in English, empty until i18n-content', async collection => {
    const html = await renderCollection(collection, 'en');
    expect(html).toContain('<html lang="en"');
    // Chrome still ships AvailabilityPill in Portuguese; this task owns the
    // catalog body inside <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(ptLeftovers(main)).toEqual([]);
  });
});

describe('CollectionPage', () => {
  it.each(['portfolio', 'lab'] as const)('keeps the pt-BR %s page byte for byte', async collection => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await renderCollection(collection, 'pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot(`../__snapshots__/${collection}.pt.html`);
  });
});

describe('CasePage', () => {
  it('keeps the pt-BR forja case page byte for byte', async () => {
    const projects = await getAllProjects();
    const project = projects.find(entry => entry.slug === 'forja');
    expect(project).toBeDefined();
    const collection = collectionOfBlock(project!.block);
    const html = (
      await (
        await AstroContainer.create()
      ).renderToString(CasePage, {
        props: { project, collection, locale: 'pt-BR' },
        request: new Request(`https://nandomoreira.dev/${collection}/forja`),
      })
    ).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/case-forja.pt.html');
  });
});
