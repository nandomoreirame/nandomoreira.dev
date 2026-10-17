import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CollectionSection from '../../src/components/home/CollectionSection.astro';
import LatestPosts from '../../src/components/home/LatestPosts.astro';
import type { Post } from '../../src/content/schemas/post';
import type { Project } from '../../src/content/schemas/project';

const post = (overrides: Partial<Post> & Pick<Post, 'slug' | 'title' | 'date'>): Post => ({
  summary: 'Resumo do post.',
  markers: ['a', 'b', 'c'],
  draft: false,
  archived: false,
  ...overrides,
});

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

describe('home list column', () => {
  it('constrains LatestPosts to the centred list measure', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(LatestPosts, {
      props: { posts: [post({ slug: 'a', title: 'A', date: '2026-01-01' })] },
    });
    const section = html.match(/<section[^>]*id="blog"[^>]*>/)?.[0] ?? '';

    expect(section).toContain('max-w-list');
    expect(section).toContain('mx-auto');
  });

  it('constrains CollectionSection to the centred list measure', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(CollectionSection, {
      props: { collection: 'lab', projects: [project()], totalCount: 1 },
    });
    const section = html.match(/<section[^>]*id="lab"[^>]*>/)?.[0] ?? '';

    expect(section).toContain('max-w-list');
    expect(section).toContain('mx-auto');
  });
});
