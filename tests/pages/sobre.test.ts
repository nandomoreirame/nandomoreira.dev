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

  it('sends "Entrar em contato" to the /contato page, not to a mail client', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const cta = html.match(/<a[^>]*>(?:(?!<\/a>)[\s\S])*?Entrar em contato[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(cta).toMatch(/href="\/contato"/);
    expect(html).not.toContain('mailto:');
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

  it('shows every result with the context that explains it', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();

    for (const stat of profile.trajectory) {
      expect(html).toContain(stat.value);
      expect(html).toContain(stat.context.trim().split('\n')[0]);
    }
  });

  it('frames each service by who it is for and links it to the case that proves it', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();

    for (const service of profile.services) {
      expect(html).toContain(service.title);
      expect(html).toMatch(new RegExp(`href="/(portfolio|lab)/${service.caseSlug}"`));
    }
  });

  it('lists the whole work history, current position first and marked as current', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();
    const work = profile.work ?? [];

    expect(work.length).toBeGreaterThan(0);
    for (const job of work) expect(html).toContain(job.name.replace(/&/g, '&amp;'));

    const experience = html.slice(html.indexOf('id="experiencia"'));
    expect(experience.indexOf(work[0].name)).toBeLessThan(experience.indexOf(work[1].name));
    expect(experience).toContain('– atual');
    for (const highlight of work[0].highlights ?? []) {
      expect(experience).toContain(highlight.slice(0, 40));
    }
  });

  it('lists education', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();

    for (const entry of profile.education ?? []) expect(html).toContain(entry.institution);
  });

  it('states how long the career runs, derived from the history instead of typed by hand', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    expect(html).toMatch(/desde 2010/i);
  });

  it('keeps a single primary call to action', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    // Unconditional class only: the skip link carries focus-visible:bg-primary.
    expect(html.match(/(?<=["\s])bg-primary\b/g)).toHaveLength(1);
  });
});
