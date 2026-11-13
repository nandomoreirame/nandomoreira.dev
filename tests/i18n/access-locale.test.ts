import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAllPosts, getAllProjects, translationPairs } from '../../src/lib/content';

describe('access layer by locale', () => {
  it('keeps pt-BR as the default', async () => {
    expect((await getAllPosts()).length).toBeGreaterThan(0);
    expect((await getAllProjects()).length).toBe(28);
  });
});

describe('English content through the overlays', () => {
  it('serves only translated items, with the pt-BR structure', async () => {
    const [ptProjects, enProjects] = await Promise.all([getAllProjects(), getAllProjects('en')]);
    for (const project of enProjects) {
      const source = ptProjects.find(item => item.slug === project.slug)!;
      expect(project.tech).toEqual(source.tech);
      expect(project.repoUrl ?? null).toEqual(source.repoUrl ?? null);
    }
  });

  it('redacts confidential cases exactly like pt-BR (REQ-005)', async () => {
    const [ptProjects, enProjects] = await Promise.all([getAllProjects(), getAllProjects('en')]);
    for (const project of enProjects) {
      if (project.confidential) {
        const source = ptProjects.find(item => item.slug === project.slug)!;
        expect(project.clientName).toBe(source.clientName);
        expect(project.confidentialMetrics).toBeUndefined();
      }
    }
  });

  it('pairs each translation with its source path', async () => {
    const pairs = await translationPairs();
    for (const pair of pairs) {
      expect(pair.en.startsWith('/en/')).toBe(true);
      expect(pair['pt-BR'].startsWith('/en')).toBe(false);
    }
  });

  it('keeps drafts out of the English public queries, as in pt-BR (C2)', async () => {
    for (const post of await getAllPosts('en')) expect(post.draft).toBe(false);
  });

  it('reads the English collections (no early return left)', () => {
    const source =
      readFileSync('src/lib/content/posts.ts', 'utf8') + readFileSync('src/lib/content/projects.ts', 'utf8');
    expect(source).not.toContain("if (locale === 'en') return");
    expect(source).toContain("getCollection('postsEn')");
    expect(source).toContain("getCollection('projectsEn')");
  });
});
