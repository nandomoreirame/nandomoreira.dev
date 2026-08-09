import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SobrePage from '../../src/pages/sobre.astro';

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
});
