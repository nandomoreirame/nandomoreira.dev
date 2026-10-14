import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { getAllPosts, getAllProjects } from '../../src/lib/content';
import { ogImagePath, ogKey, ogPages } from '../../src/lib/og/pages';

const site = new URL('https://nandomoreira.dev');

describe('ogKey', () => {
  it('names the home index and keeps nested paths', () => {
    expect(ogKey('/')).toBe('index');
    expect(ogKey('/portfolio/abracce')).toBe('portfolio/abracce');
    expect(ogImagePath('/sobre')).toBe('/og/sobre.png');
  });
});

describe('ogPages', () => {
  it('covers every HTML page of the sitemap, plus the résumé page', async () => {
    const [projects, posts] = await Promise.all([getAllProjects(), getAllPosts()]);
    const sitemapPaths = [...buildSitemap({ site, projects, posts }).matchAll(/<loc>https:\/\/nandomoreira\.dev([^<]*)<\/loc>/g)]
      .map((match) => match[1] || '/')
      .filter((path) => !path.startsWith('/api/'));
    const keys = new Set((await ogPages()).map((page) => page.key));

    for (const path of [...sitemapPaths, '/curriculo']) expect(keys, path).toContain(ogKey(path));
  });

  it('gives every page a title and an eyebrow', async () => {
    for (const page of await ogPages()) {
      expect(page.title.trim(), page.key).not.toBe('');
      expect(page.eyebrow.trim(), page.key).not.toBe('');
    }
  });
});
