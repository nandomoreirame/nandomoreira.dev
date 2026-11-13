import { describe, expect, it } from 'vitest';
import { buildSitemap } from '../../src/lib/aeo/sitemap';

const site = new URL('https://nandomoreira.dev');
const pairs = [{ 'pt-BR': '/o-falso-verde', en: '/en/the-false-green' }];

describe('bilingual sitemap', () => {
  it('lists English pages and links each pair both ways when live', () => {
    const xml = buildSitemap({ site, projects: [], posts: [], enLive: true, pairs });
    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
    expect(xml).toContain('<loc>https://nandomoreira.dev/en/about</loc>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://nandomoreira.dev/en/about"/>');
    expect(xml).toContain('<xhtml:link rel="alternate" hreflang="pt-BR" href="https://nandomoreira.dev/sobre"/>');
    expect(xml).toContain('<loc>https://nandomoreira.dev/en/the-false-green</loc>');
  });

  it('is unchanged while English is not live', () => {
    const before = buildSitemap({ site, projects: [], posts: [] });
    expect(buildSitemap({ site, projects: [], posts: [], enLive: false, pairs })).toBe(before);
    expect(before).not.toContain('/en');
  });
});
