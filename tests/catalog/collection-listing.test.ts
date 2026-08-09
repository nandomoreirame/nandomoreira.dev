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
  it('lists rows, never cards', async () => {
    const html = await render({
      collection: 'lab',
      projects: [project()],
    });

    expect(html).toContain('href="/lab/forja"');
    expect(html).toContain('Forja');
    expect(html).toContain('01/2026');
    expect(html).not.toContain('ProjectCard');
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

  it('shows the total count in the section header', async () => {
    const html = await render({
      collection: 'portfolio',
      projects: [
        project({ block: 'professional', slug: 'a', date: '2026-01-01' }),
        project({ block: 'ai-product', slug: 'b', date: '2026-02-01' }),
      ],
    });

    expect(html).toContain('(02)');
    expect(html).toContain('Portfólio');
  });

  it('renders an explicit empty state when the grouping has no projects', async () => {
    const html = await render({ collection: 'portfolio', projects: [] });

    expect(html).toMatch(/nenhum case|em breve|ainda/i);
    expect(html).toContain('(00)');
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
});

describe('/portfolio and /lab pages', () => {
  it.each(['src/pages/portfolio/index.astro', 'src/pages/lab/index.astro'])(
    '%s reads through the access layer, never through getCollection',
    (path) => {
      const source = pageSource(path);

      expect(source).toContain('getAllProjects');
      expect(source).toContain('CollectionListing');
      expect(source).not.toContain('getCollection(');
    },
  );
});
