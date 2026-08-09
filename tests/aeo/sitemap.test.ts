import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../src/lib/aeo/sitemap';

const site = new URL('https://nandomoreira.dev');

const projects = [
  { slug: 'forja', title: 'Forja & Cia', updatedAt: '2026-08-01' },
  { slug: 'bragstack', title: 'Bragstack', updatedAt: '2026-07-15' },
] as never[];

const output = () => buildSitemap({ site, projects });

describe('buildSitemap', () => {
  it('is well-formed XML with the sitemap namespace', () => {
    const xml = output();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
  });

  it('lists the home, the catalogue and every case', () => {
    const xml = output();

    expect(xml).toContain('<loc>https://nandomoreira.dev/</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/projetos</loc>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/projetos/forja</loc>');
  });

  it('excludes machine routes and error pages', () => {
    const xml = output();

    for (const excluded of ['/llms.txt', '/AGENTS.md', '/robots.txt', '/api/', '/404']) {
      expect(xml).not.toContain(excluded);
    }
  });

  it('derives lastmod from content, never from the current time', () => {
    expect(output()).toContain('<lastmod>2026-08-01</lastmod>');
  });

  it('escapes XML entities in derived values', () => {
    const xml = buildSitemap({
      site,
      projects: [{ slug: 'a&b', title: 'A & B', updatedAt: '2026-08-01' }] as never[],
    });

    expect(xml).toContain('a&amp;b');
    expect(xml).not.toMatch(/<loc>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)/);
  });

  it('produces a valid document for an empty catalogue', () => {
    const xml = buildSitemap({ site, projects: [] });

    expect(xml).toContain('<loc>https://nandomoreira.dev/</loc>');
    expect(xml).toContain('</urlset>');
  });
});
