import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/content/schemas/project';
import { featured, groupByBlock, sortProjects } from '../../src/lib/content/projects';

const project = (overrides: Partial<Project>): Project =>
  ({
    slug: 'x',
    title: 'X',
    block: 'professional',
    summary: 's',
    problem: 'p',
    decisions: 'd',
    outcome: 'o',
    tech: ['TypeScript'],
    repoUrl: 'https://example.com',
    liveUrl: null,
    featured: false,
    confidential: false,
    ...overrides,
  }) as Project;

const catalogue = [
  project({ slug: 'c', title: 'C', block: 'professional' }),
  project({ slug: 'a', title: 'A', block: 'ai-tooling', featured: true }),
  project({ slug: 'b', title: 'B', block: 'ai-product', featured: true }),
];

describe('groupByBlock', () => {
  it('returns the four blocks in positioning order, not alphabetically', () => {
    expect(groupByBlock(catalogue).map((group) => group.block)).toEqual([
      'ai-tooling',
      'ai-product',
      'systems-cli',
      'professional',
    ]);
  });

  it('keeps an empty block in the result, so the gap is visible', () => {
    const group = groupByBlock(catalogue).find((g) => g.block === 'systems-cli');
    expect(group?.projects).toEqual([]);
  });
});

describe('featured', () => {
  it('returns only the highlighted projects', () => {
    expect(featured(catalogue).map((p) => p.slug)).toEqual(['a', 'b']);
  });

  it('is stable: the same input always yields the same order', () => {
    expect(featured(catalogue)).toEqual(featured(catalogue));
  });
});

describe('sortProjects', () => {
  it('orders by title, so the grid never reshuffles between builds', () => {
    expect(sortProjects(catalogue).map((p) => p.slug)).toEqual(['a', 'b', 'c']);
  });
});
