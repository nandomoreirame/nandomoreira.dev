import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';
import { buildResume } from '../../src/lib/aeo/resume';
import { getAllProjects, getProfile } from '../../src/lib/content';
import { displayNameOf } from '../../src/lib/content/display-name';
import { homeMeta } from '../../src/lib/home/meta';
import { personLd } from '../../src/lib/home/person-ld';
import Contato from '../../src/pages/contato.astro';
import Home from '../../src/pages/index.astro';
import Privacidade from '../../src/pages/privacidade.astro';
import Sobre from '../../src/pages/sobre.astro';

const site = new URL('https://nandomoreira.dev');

// The AGENTS.md brief (<pre>) is text for an agent to read, so it keeps the
// full name like every other machine surface.
const visible = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '')
    .replace(/<meta[^>]*>/g, '')
    .replace(/<link[^>]*>/g, '');

describe('displayNameOf', () => {
  it('prefers the short display name and falls back to the full name', () => {
    expect(displayNameOf({ name: 'A B C', displayName: 'A B' } as never)).toBe('A B');
    expect(displayNameOf({ name: 'A B C' } as never)).toBe('A B C');
  });
});

describe('human surfaces show the short name', () => {
  it.each([
    ['/', Home],
    ['/sobre', Sobre],
    ['/contato', Contato],
    ['/privacidade', Privacidade],
  ])('%s never shows "Costa" to a person', async (path, page) => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(page as never, {
      request: new Request(`https://nandomoreira.dev${path}`),
    });
    expect(visible(html)).toContain('Fernando Moreira');
    expect(visible(html)).not.toContain('Moreira Costa');
  });

  it('uses the short name in the home title', async () => {
    expect(homeMeta(await getProfile()).title).toMatch(/^Fernando Moreira \/\/ /);
  });
});

describe('machine surfaces keep the full name', () => {
  it('in JSON-LD, AGENTS.md and the résumé', async () => {
    const profile = await getProfile();
    expect(profile.name).toBe('Fernando Moreira Costa');
    expect(personLd(profile, site.origin).name).toBe('Fernando Moreira Costa');
    expect(buildAgentsMd({ site, profile })).toContain('Fernando Moreira Costa');
    const resume = buildResume({ site, profile, projects: await getAllProjects() });
    expect(JSON.stringify(resume)).toContain('Fernando Moreira Costa');
  });
});
