import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects } from '../../src/lib/content';
import ProjetosIndex from '../../src/pages/projetos/index.astro';
import ProjetosSlug from '../../src/pages/projetos/[slug].astro';

const read = (path: string) => readFileSync(path, 'utf8');

describe('legacy /projetos redirects', () => {
  it('redirects the catalogue index with a real 301 to /portfolio', async () => {
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ProjetosIndex);

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe('/portfolio');
  });

  it('redirects each known case slug with a real 301 to its collection path', async () => {
    const projects = await getAllProjects();
    expect(projects.length).toBeGreaterThan(0);

    const project = projects[0]!;
    const expected = `/${collectionOfBlock(project.block)}/${project.slug}`;

    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ProjetosSlug, {
      params: { slug: project.slug },
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(expected);
  });

  it('returns 404 for an unknown slug instead of redirecting', async () => {
    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ProjetosSlug, {
      params: { slug: 'this-slug-does-not-exist-anywhere' },
    });

    expect(response.status).toBe(404);
    const location = response.headers.get('Location');
    expect(location).toBeNull();
  });

  it('resolves projects through the access layer, never getCollection', () => {
    const source = read('src/pages/projetos/[slug].astro');

    expect(source).toMatch(/getProject|getAllProjects/);
    expect(source).toContain('collectionOfBlock');
    expect(source).not.toContain('getCollection(');
    expect(source).not.toContain('prerender');
    expect(source).not.toContain('getStaticPaths');
  });
});

describe('new case routes', () => {
  it.each(['src/pages/portfolio/[slug].astro', 'src/pages/lab/[slug].astro'])(
    '%s derives paths from the access layer',
    path => {
      const source = read(path);

      expect(source).toContain('getAllProjects');
      expect(source).toContain('collectionOfBlock');
      expect(source).not.toContain('getCollection(');
      expect(source).toContain('CaseArticle');
    },
  );
});

describe('/conectar moved to /mcp', () => {
  it('keeps old links working with a real 301', () => {
    expect(read('astro.config.mjs')).toMatch(/'\/conectar':\s*'\/mcp'/);
  });
});
