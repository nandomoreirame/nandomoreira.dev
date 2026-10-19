import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CollectionSection from '../../src/components/home/CollectionSection.astro';
import type { Project } from '../../src/content/schemas/project';
import { COLLECTION_COPY } from '../../src/lib/catalog/collection-copy';

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Cliente GUI multi-CLI',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: true,
    confidential: false,
    date: '2026-01-15',
    ...overrides,
  }) as Project;

const render = async (collection: 'portfolio' | 'lab', projects: Project[], totalCount?: number) => {
  const container = await AstroContainer.create();
  return container.renderToString(CollectionSection, {
    props: { collection, projects, totalCount: totalCount ?? projects.length },
  });
};

describe('CollectionSection', () => {
  it('titles itself from the catalogue labels, not from a local string', async () => {
    // COLLECTION_LABELS is the single source: a local copy would drift from
    // the listing pages the section links to.
    expect(await render('portfolio', [project({ block: 'professional' })])).toContain('Portfólio');
    expect(await render('lab', [project()])).toContain('Laboratório');
  });

  it.each(['portfolio', 'lab'] as const)(
    'describes %s with the same text as its own page, from one source',
    async collection => {
      expect(await render(collection, [])).toContain(COLLECTION_COPY[collection].description);
    },
  );

  it('anchors itself on the collection it shows', async () => {
    expect(await render('portfolio', [project({ block: 'professional' })])).toContain('id="portfolio"');
    expect(await render('lab', [project()])).toContain('id="lab"');
  });

  it('sends the see-all link to its own listing, never to the other one', async () => {
    const lab = await render('lab', [project()], 9);
    expect(lab).toContain('href="/lab"');
    expect(lab).not.toContain('href="/portfolio"');

    const portfolio = await render('portfolio', [project({ block: 'professional' })], 9);
    expect(portfolio).toContain('href="/portfolio"');
  });

  it('styles the see-all link as mono with a trailing Lucide arrow', async () => {
    const html = await render('lab', [project()], 9);
    const link =
      html.match(/<a[^>]*href="\/lab"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? html.match(/<a[^>]*href="\/lab"[^>]*>/)?.[0] ?? '';

    expect(link).toContain('href="/lab"');
    expect(link).toContain('font-mono');
    expect(link).toContain('data-icon="lucide:arrow-right"');
    expect(link).toContain('Ver todos');
  });

  it('lists rows instead of cards', async () => {
    const html = await render('lab', [project()]);

    expect(html).toContain('href="/lab/forja"');
    expect(html).not.toContain('aspect-video');
  });

  it('limits the list to five items', async () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      project({ slug: `p-${i}`, title: `Project ${i}`, date: `2026-0${(i % 9) + 1}-01` }),
    );
    const html = await render('lab', many, 7);

    expect((html.match(/Project \d/g) ?? []).length).toBeLessThanOrEqual(5);
  });

  it('shows the see-all link with the total only when there are more items than shown', async () => {
    const withMore = await render('lab', [project()], 8);
    expect(withMore).toMatch(/8|todos/i);

    const exact = await render('lab', [project()], 1);
    expect(exact).not.toMatch(/ver todos/i);
  });

  it('renders an explicit empty state instead of vanishing', async () => {
    expect(await render('portfolio', [])).toMatch(/nenhum|em breve/i);
  });

  it('uses h2, so the hierarchy never skips from h1 to h3', async () => {
    expect(await render('lab', [project()])).toContain('<h2');
  });

  it('adds no second primary call to action', async () => {
    expect(await render('lab', [project()])).not.toContain('bg-primary');
  });

  it('refuses a case from the other collection instead of linking to a dead route', async () => {
    // forja is ai-tooling, so it lives at /lab/forja. Rendered inside the
    // portfolio section its row href would be /portfolio/forja, a 404 that
    // nothing else in the suite would notice.
    await expect(render('portfolio', [project({ block: 'ai-tooling' })])).rejects.toThrow(/does not exist/);
  });
});
