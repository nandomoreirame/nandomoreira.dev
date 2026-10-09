import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../src/lib/aeo/sitemap';

const site = new URL('https://nandomoreira.dev');

const projects = [
  {
    slug: 'forja',
    title: 'Forja & Cia',
    block: 'ai-tooling',
    updatedAt: '2026-08-01',
  },
  {
    slug: 'bragstack',
    title: 'Bragstack',
    block: 'ai-product',
    updatedAt: '2026-07-15',
  },
] as never[];

const output = () => buildSitemap({ site, projects });

describe('buildSitemap', () => {
  it('is well-formed XML with the sitemap namespace', () => {
    const xml = output();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  it('lists the home, both collections, about and every case on its collection path', () => {
    const xml = output();

    expect(xml).toContain('<loc>https://nandomoreira.dev/</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/portfolio</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/lab</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/sobre</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/lab/forja</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/lab/bragstack</loc>');
  });

  it('never lists a redirected legacy path, which would teach crawlers to distrust the file', () => {
    const xml = output();

    expect(xml).not.toContain('/projetos');
    expect(xml).not.toContain('/notas');
  });

  it('excludes error pages and the discovery files themselves', () => {
    const xml = output();

    for (const excluded of [
      '/llms.txt',
      '/llms-full.txt',
      '/ai-index.json',
      '/AGENTS.md',
      '/robots.txt',
      '/404',
      '.md',
    ]) {
      expect(xml).not.toContain(excluded);
    }
  });

  it('keeps the AI views and the page markdown out, since both mirror a listed page', () => {
    const xml = output();
    expect(xml).not.toMatch(/<loc>[^<]*\/ia<\/loc>/);
    expect(xml).not.toMatch(/<loc>[^<]*\.md<\/loc>/);
  });

  it('lists the page that teaches agents to connect', () => {
    expect(output()).toContain('<loc>https://nandomoreira.dev/mcp</loc>');
  });

  it('lists both resume routes, which are indexable content and not protocol files', () => {
    // REQ-012 of structured-resume. A crawler that never renders a page still
    // has a route to the same facts, which is the point of the resume.
    const xml = output();

    expect(xml).toContain('/api/resume.json');
    expect(xml).toContain('/api/resume.txt');
  });

  it('still keeps the non-indexable endpoints out', () => {
    const xml = output();

    expect(xml).not.toContain('/api/health');
    expect(xml).not.toContain('/api/hire');
  });

  it('derives lastmod from content, never from the current time', () => {
    expect(output()).toContain('<lastmod>2026-08-01</lastmod>');
  });

  it('escapes XML entities in derived values', () => {
    const xml = buildSitemap({
      site,
      projects: [
        {
          slug: 'a&b',
          title: 'A & B',
          block: 'professional',
          updatedAt: '2026-08-01',
        },
      ] as never[],
    });

    expect(xml).toContain('a&amp;b');
    expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  it('produces a valid document for an empty catalogue', () => {
    const xml = buildSitemap({ site, projects: [] });

    expect(xml).toContain('<loc>https://nandomoreira.dev/</loc>');
    expect(xml).toContain('</urlset>');
  });

  it('lists posts at the root path, matching the real route', () => {
    const xml = buildSitemap({
      site,
      projects: [],
      posts: [
        {
          slug: 'como-instalar-o-gulp-4',
          title: 'Gulp 4',
          summary: 's',
          date: '2015-09-26',
          draft: false,
          archived: true,
        },
      ] as never[],
    });

    expect(xml).toContain('<loc>https://nandomoreira.dev/como-instalar-o-gulp-4</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/posts</loc>');
    expect(xml).not.toContain('/notas/');
  });

  it('includes the archive index and each year', () => {
    const xml = buildSitemap({
      site,
      projects: [],
      posts: [
        {
          slug: 'a',
          title: 'A',
          summary: 's',
          date: '2015-01-01',
          draft: false,
          archived: true,
        },
        {
          slug: 'b',
          title: 'B',
          summary: 's',
          date: '2016-01-01',
          draft: false,
          archived: true,
        },
      ] as never[],
    });

    expect(xml).toContain('/posts/arquivo');
    expect(xml).toContain('/posts/arquivo/2015');
    expect(xml).toContain('/posts/arquivo/2016');
  });

  it('omits the posts section entirely when none are published', () => {
    const xml = buildSitemap({ site, projects: [], posts: [] });
    expect(xml).not.toContain('/posts');
  });
});
