import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
import { webPageLd } from '../../src/lib/aeo/webpage-ld';
import { getProfile } from '../../src/lib/content';
import { homeMeta } from '../../src/lib/home/meta';
import { organizationLd } from '../../src/lib/home/organization-ld';
import { mcpClients, mcpHowToLd } from '../../src/lib/mcp/clients';
import Home from '../../src/pages/index.astro';
import Mcp from '../../src/pages/mcp.astro';

const site = new URL('https://nandomoreira.dev');

/** Top-level JSON-LD objects, which is what AEO checkers read. */
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(
    (match) => JSON.parse(match[1]) as Record<string, unknown>,
  );

const render = async (page: unknown, path = '/') => {
  const container = await AstroContainer.create();
  return container.renderToString(page as never, { request: new Request(`https://nandomoreira.dev${path}`) });
};

describe('home meta (AEO meta quality)', () => {
  it('keeps the real home title between 10 and 70 characters', async () => {
    const { title } = homeMeta(await getProfile());
    expect(title.length).toBeGreaterThanOrEqual(10);
    expect(title.length).toBeLessThanOrEqual(70);
    expect(title).toMatch(/^Fernando Moreira \/\/ Desenvolvedor de software/);
  });

  it('keeps the real home description between 50 and 200 characters, on one line', async () => {
    const { description } = homeMeta(await getProfile());
    expect(description.length).toBeGreaterThanOrEqual(50);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).not.toMatch(/\n|\s{2}/);
  });

  it('drops the tail after the comma when name and headline do not fit', () => {
    const { title } = homeMeta({
      name: 'Fernando Moreira Costa',
      headline: 'Desenvolvedor de software e engenheiro de IA, do dado à produção',
      positioning: 'x'.repeat(80),
    } as never);
    expect(title).toBe('Fernando Moreira Costa // Desenvolvedor de software e engenheiro de IA');
  });

  it('cuts an over-long description on a word, never mid-word', () => {
    const { description } = homeMeta({
      name: 'N',
      headline: 'H',
      positioning: 'palavra '.repeat(40),
    } as never);
    expect(description.length).toBeLessThanOrEqual(200);
    expect(description).toMatch(/palavra…$/);
  });

  it('is what the home page actually serves', async () => {
    const html = await render(Home);
    const { title, description } = homeMeta(await getProfile());
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain(`<meta name="description" content="${description}"`);
  });
});

describe('WebPage on every page', () => {
  it('describes the page and points at the WebSite', () => {
    expect(webPageLd({ site, path: '/sobre', title: 'Sobre', description: 'D' })).toEqual({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Sobre',
      description: 'D',
      url: 'https://nandomoreira.dev/sobre',
      inLanguage: 'pt-BR',
      isPartOf: { '@type': 'WebSite', url: 'https://nandomoreira.dev/' },
    });
  });

  it('is emitted by the base layout', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(BaseLayout, {
      props: { title: 'Título', description: 'Descrição' },
      slots: { default: '<p>x</p>' },
    });
    expect(jsonLd(html).map((item) => item['@type'])).toContain('WebPage');
  });
});

describe('Organization on the home (the site brand)', () => {
  it('names the brand, with a raster logo, the public profiles and the founder', async () => {
    const profile = await getProfile();
    const org = organizationLd(profile, site);
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe('nandomoreira.dev');
    expect(org.logo).toBe('https://nandomoreira.dev/logo.png');
    expect(org.sameAs.length).toBeGreaterThan(0);
    expect(org.sameAs.every((url) => url.startsWith('https://'))).toBe(true);
    expect(org.founder).toEqual({ '@type': 'Person', name: profile.name });
    expect(JSON.stringify(org)).not.toContain('@nandomoreira');
  });

  it('ships the logo as a square PNG', () => {
    expect(existsSync('public/logo.png')).toBe(true);
    const png = readFileSync('public/logo.png');
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(512);
    expect(png.readUInt32BE(20)).toBe(512);
  });

  it('is a top-level object on the home', async () => {
    expect(jsonLd(await render(Home)).map((item) => item['@type'])).toContain('Organization');
  });
});

describe('HowTo on /mcp', () => {
  it('turns each client into a section of steps, ending on the code to paste', () => {
    const howTo = mcpHowToLd(site);
    expect(howTo['@type']).toBe('HowTo');
    expect(howTo.step).toHaveLength(mcpClients('x').length);
    for (const section of howTo.step) {
      expect(section['@type']).toBe('HowToSection');
      expect(section.itemListElement.length).toBeGreaterThanOrEqual(2);
      for (const step of section.itemListElement) expect(step['@type']).toBe('HowToStep');
    }
    expect(JSON.stringify(howTo)).toContain('https://nandomoreira.dev/api/mcp');
  });

  it('is a top-level object on the page', async () => {
    expect(jsonLd(await render(Mcp, '/mcp')).map((item) => item['@type'])).toContain('HowTo');
  });
});
