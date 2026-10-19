import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CollectionListing from '../../src/components/catalog/CollectionListing.astro';
import type { Project } from '../../src/content/schemas/project';

const pageSource = (path: string) => readFileSync(path, 'utf8');

const project = (overrides: Partial<Project> = {}): Project =>
  ({
    slug: 'forja',
    title: 'Forja',
    block: 'ai-tooling',
    summary: 'Cliente GUI multi-CLI',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['Rust', 'Tauri'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: true,
    confidential: false,
    date: '2026-01-15',
    ...overrides,
  }) as Project;

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(CollectionListing, { props });
};

describe('CollectionListing', () => {
  it('lists a row per case, with its art, title and date, linking to the real route', async () => {
    const html = await render({
      collection: 'lab',
      projects: [project()],
    });

    expect(html).toContain('href="/lab/forja"');
    expect(html).toContain('Forja');
    expect(html).toContain('01/2026');
    expect(html).toContain('data-motif="orbit"');
    expect(html).toContain('data-art');
  });

  it('lists the portfolio as rows, with summary, stack and situation beside the art', async () => {
    const html = await render({
      collection: 'portfolio',
      projects: [
        project({
          slug: 'seu-atelie-aqui',
          title: 'Seu Ateliê Aqui',
          block: 'professional',
          art: 'map',
          summary: 'Plataforma por proximidade geográfica',
          discontinued: true,
        }),
      ],
    });

    expect(html).toContain('href="/portfolio/seu-atelie-aqui"');
    expect(html).toContain('data-motif="map"');
    expect(html).toContain('Plataforma por proximidade geográfica');
    expect(html).toContain('Rust');
    expect(html).toContain('Descontinuado');
    expect(html).toMatch(/\bsm:grid-cols-5\b/);
  });

  it('lists the lab as rows too, with the summary beside the art', async () => {
    const html = await render({ collection: 'lab', projects: [project({ art: 'panels' })] });

    expect(html).toContain('data-motif="panels"');
    expect(html).toContain('Cliente GUI multi-CLI');
    expect(html).toContain('Tauri');
    expect(html).toMatch(/\bsm:grid-cols-5\b/);
    expect(html).not.toMatch(/\bsm:grid-cols-2\b/);
  });

  it.each(['portfolio', 'lab'])('alternates the art side in %s: odd items left, even items right', async collection => {
    const block = collection === 'lab' ? 'ai-tooling' : 'professional';
    const projects = ['2026-03-01', '2026-02-01', '2026-01-01'].map((date, index) =>
      project({ slug: `case-${index}`, title: `Case ${index}`, block, date }),
    );
    const rows = (await render({ collection, projects })).split(/<li[\s>]/).slice(1);

    expect(rows).toHaveLength(3);
    expect(rows[0]).not.toContain('data-flipped');
    expect(rows[1]).toContain('data-flipped');
    expect(rows[2]).not.toContain('data-flipped');
  });

  it('leaves the pointer field to the layout, which covers the whole page', async () => {
    const html = await render({ collection: 'lab', projects: [project()] });
    expect(html).not.toContain('data-pointer-field');
  });

  it('sorts from most recent to oldest', async () => {
    const html = await render({
      collection: 'lab',
      projects: [
        project({ slug: 'old', title: 'Old', date: '2024-01-01' }),
        project({ slug: 'new', title: 'New', date: '2026-06-01' }),
      ],
    });

    expect(html.indexOf('New')).toBeLessThan(html.indexOf('Old'));
  });

  it('names its region without repeating the page heading or the count', async () => {
    const html = await render({
      collection: 'portfolio',
      projects: [
        project({ block: 'professional', slug: 'a', date: '2026-01-01' }),
        project({ block: 'professional', slug: 'b', date: '2026-02-01' }),
      ],
    });

    // The page header names and counts the collection (tests/pages/page-headers.test.ts).
    expect(html).toContain('aria-label="Portfólio"');
    expect(html).not.toMatch(/<h[1-3]/);
    expect(html).not.toContain('(02)');
  });

  it('renders an explicit empty state when the grouping has no projects', async () => {
    const html = await render({ collection: 'portfolio', projects: [] });

    expect(html).toMatch(/nenhum case|em breve|ainda/i);
  });

  it('only includes projects whose block belongs to the collection', async () => {
    const html = await render({
      collection: 'lab',
      projects: [
        project({ slug: 'lab-case', block: 'ai-tooling', title: 'Lab Case' }),
        project({ slug: 'client-case', block: 'professional', title: 'Client Case' }),
      ],
    });

    expect(html).toContain('Lab Case');
    expect(html).not.toContain('Client Case');
  });

  it('hides the live host on a discontinued case even when liveUrl remains', async () => {
    const html = await render({
      collection: 'portfolio',
      projects: [
        project({
          slug: 'old-shop',
          title: 'Old Shop',
          block: 'professional',
          discontinued: true,
          liveUrl: 'https://www.old-shop.example/',
          repoUrl: null,
        }),
      ],
    });

    expect(html).toContain('Descontinuado');
    expect(html).not.toContain('data-live');
    expect(html).not.toContain('No ar');
  });

  it('shows the live host on a published case that has a liveUrl', async () => {
    const html = await render({
      collection: 'lab',
      projects: [
        project({
          slug: 'live-app',
          title: 'Live App',
          liveUrl: 'https://www.bragstack.app/',
        }),
      ],
    });

    expect(html).toMatch(/<span[^>]*data-live/);
    expect(html).toContain('No ar · bragstack.app');
  });
});

describe('/portfolio and /lab pages', () => {
  it.each(['src/pages/portfolio/index.astro', 'src/pages/lab/index.astro'])(
    '%s reads through the access layer, never through getCollection',
    path => {
      const source = pageSource(path);

      expect(source).toContain('getAllProjects');
      expect(source).toContain('CollectionListing');
      expect(source).not.toContain('getCollection(');
    },
  );
});
