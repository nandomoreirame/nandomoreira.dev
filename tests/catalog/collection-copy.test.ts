import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLLECTION_COPY } from '../../src/lib/catalog/collection-copy';

describe('collection copy', () => {
  it('describes the lab by what it holds, not by language', () => {
    const { description, metaDescription } = COLLECTION_COPY.lab;
    for (const text of [description, metaDescription]) {
      expect(text).not.toMatch(/\b(Rust|Go|Python|QML|TypeScript)\b/);
    }
    expect(description).toMatch(/desktop Linux/);
    expect(description).toMatch(/automaç/);
  });

  it('puts the SaaS products in the portfolio copy and out of the lab copy', () => {
    for (const text of [COLLECTION_COPY.portfolio.description, COLLECTION_COPY.portfolio.metaDescription]) {
      expect(text).toMatch(/SaaS/);
    }
    for (const text of [COLLECTION_COPY.lab.description, COLLECTION_COPY.lab.metaDescription]) {
      expect(text).not.toMatch(/SaaS/);
    }
    // The portfolio no longer holds only client work.
    expect(COLLECTION_COPY.portfolio.title).not.toMatch(/^Trabalho de cliente/);
  });

  it.each([
    ['src/pages/lab/index.astro', 'lab'],
    ['src/pages/portfolio/index.astro', 'portfolio'],
  ])('%s reads its copy from the single source', (file, collection) => {
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('COLLECTION_COPY');
    expect(source).not.toContain(COLLECTION_COPY[collection as 'lab'].description);
  });

  it('feeds the AI view from the same source', () => {
    const registry = readFileSync('src/lib/ai-view/registry.ts', 'utf8');
    expect(registry).toContain("from '../catalog/collection-copy'");
    expect(registry).not.toMatch(/const COLLECTION_COPY/);
  });
});

describe('collection meta descriptions', () => {
  it.each(['portfolio', 'lab'] as const)('gives %s a meta description between 70 and 160 characters', collection => {
    const { metaDescription } = COLLECTION_COPY[collection];
    expect(metaDescription.length).toBeGreaterThanOrEqual(70);
    expect(metaDescription.length).toBeLessThanOrEqual(160);
  });
});
