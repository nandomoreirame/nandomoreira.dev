import { describe, expect, it } from 'vitest';
import { buildSitemap, sitemapEntries } from '../../src/lib/aeo/sitemap';
import { ogPages } from '../../src/lib/og/pages';

describe('sales pages in the sitemap', () => {
  it('keeps English sales URLs outside the main-host sitemap (REQ-010)', () => {
    const xml = buildSitemap({
      site: new URL('https://nandomoreira.dev'),
      projects: [],
      posts: [],
      enLive: true,
      pairs: [],
      salesLive: true,
    });
    expect(xml).not.toContain('/en/services');
    expect(xml).not.toContain('contrate.nandomoreira.dev');
  });
  it('lists the landing and the detail page while they live on the main host', () => {
    const paths = sitemapEntries({ projects: [], salesLive: false }).map(entry => entry.path);
    expect(paths).toContain('/servicos');
    expect(paths).toContain('/servicos/site-institucional');
  });

  it('drops them once the subdomain is live, since the main host answers 301', () => {
    const paths = sitemapEntries({ projects: [], salesLive: true }).map(entry => entry.path);
    expect(paths.some(path => path.startsWith('/servicos'))).toBe(false);
  });
});

describe('sales share cards', () => {
  it('generates a card for each sales page', async () => {
    const keys = (await ogPages()).map(page => page.key);
    expect(keys).toContain('servicos');
    expect(keys).toContain('servicos/site-institucional');
  });
});
