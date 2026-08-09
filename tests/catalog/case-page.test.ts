import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects } from '../../src/lib/content';
import ProjetosSlug from '../../src/pages/projetos/[slug].astro';

const page = readFileSync('src/pages/projetos/[slug].astro', 'utf8');

describe('/projetos/[slug]', () => {
  it('resolves through the access layer, not getCollection or a hand-written list', () => {
    expect(page).toContain('getProject');
    expect(page).toContain('collectionOfBlock');
    expect(page).not.toContain('getCollection(');
    expect(page).not.toContain('prerender');
    expect(page).not.toContain('getStaticPaths');
  });

  it('permanently redirects each known case with a real 301', async () => {
    const projects = await getAllProjects();
    const project = projects[0]!;
    const expected = `/${collectionOfBlock(project.block)}/${project.slug}`;

    const container = await AstroContainer.create();
    const response = await container.renderToResponse(ProjetosSlug, {
      params: { slug: project.slug },
    });

    expect(response.status).toBe(301);
    expect(response.headers.get('Location')).toBe(expected);
  });
});
