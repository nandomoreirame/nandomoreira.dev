import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SobrePage from '../../src/pages/sobre.astro';
import { getProfile } from '../../src/lib/content';

const source = readFileSync('src/pages/sobre.astro', 'utf8');

describe('/sobre', () => {
  it('reads the profile through the access layer, never through getCollection', () => {
    expect(source).toContain('getProfile');
    expect(source).not.toContain('getCollection(');
  });

  it('renders the full bio and stack with TechBadge', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    expect(html).toMatch(/Construo|ferramental|agentes/i);
    // TechBadge uses mono and renders the name as text.
    expect(html).toContain('font-mono');
    expect(html).toContain('TypeScript');
  });

  it('offers a contact channel', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    expect(html).toMatch(/contato|mailto:|#contato|href="\/#contato"/i);
  });

  it('has exactly one h1', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('leads with the positioning statement, not with the name', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();

    // The name already sits in the header wordmark on every page. Spending the
    // largest type on it again says nothing; the headline does the work.
    const h1 = html.slice(html.indexOf('<h1'), html.indexOf('</h1>'));

    expect(h1).toContain(profile.headline);
    expect(h1).not.toContain(profile.name);
  });

  it('labels the page with a small eyebrow that carries no divider', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    // Anchored inside <article>: the nav also renders the word "Sobre", and
    // the header above it legitimately carries a border-b.
    const article = html.slice(html.indexOf('<article'), html.indexOf('<h1'));

    expect(article).toMatch(/Sobre/);
    expect(article).toMatch(/tracking-eyebrow/);
    // The rule under the eyebrow competed with the headline right below it.
    expect(article).not.toMatch(/border-b/);
  });
});
