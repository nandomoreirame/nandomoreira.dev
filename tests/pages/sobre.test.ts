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

    expect(html).toContain('href="/go/contato/github"');
    expect(html).toContain('href="/go/contato/linkedin"');
    // Links go through /go; only the head's rel=me names the profile itself.
    expect(html).not.toMatch(/<a[^>]*href="https:\/\/github\.com\/nandomoreirame"/);
  });

  it('sends "Entrar em contato" to the /contato page, not to a mail client', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const cta = html.match(/<a[^>]*>(?:(?!<\/a>)[\s\S])*?Entrar em contato[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(cta).toMatch(/href="\/contato"/);
    expect(html).not.toContain('mailto:');
  });

  it('shows the portrait with alt text, dimensions and modern formats', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const img = html.match(/<img[^>]*src="\/profile\/[^"]+"[^>]*>/)?.[0] ?? '';

    expect(img).toMatch(/alt="Ilustração de [^"]+"/);
    expect(img).toMatch(/width="\d+"/);
    expect(img).toMatch(/height="\d+"/);
    expect(html).toContain('type="image/avif"');
  });

  it('keeps the referrer on the profile links, which go through /go', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const links = html.match(/<a[^>]*href="\/go\/contato\/[^"]*"[^>]*>/g) ?? [];

    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).not.toContain('noreferrer');
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

  it('names the page as ~/sobre before the h1', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    expect(html).toMatch(/<p[^>]*data-page-path[^>]*>~\/sobre<\/p>/);
  });

  it('labels the page with a terminal path and no divider under it', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);

    // Anchored inside <article>: the nav also renders the word "Sobre", and
    // the header above it legitimately carries a border-b.
    const article = html.slice(html.indexOf('<article'), html.indexOf('<h1'));
    const path = article.match(/<p[^>]*data-page-path[^>]*>[\s\S]*?<\/p>/)?.[0] ?? '';

    expect(path).toContain('~/sobre');
    expect(path).toContain('text-primary');
    expect(path).not.toContain('uppercase');
    // The rule under the path competed with the headline right below it.
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

  it('lists the whole work history, most recent first, each with its real period', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SobrePage);
    const profile = await getProfile();
    const work = profile.work ?? [];

    expect(work.length).toBeGreaterThan(0);
    for (const job of work) expect(html).toContain(job.name.replace(/&/g, '&amp;'));

    const experience = html.slice(html.indexOf('id="experiencia"'));
    expect(experience.indexOf(work[0].name)).toBeLessThan(experience.indexOf(work[1].name));
    // Liquid AI ended on 2026-09-30: no position is current now.
    expect(experience).toContain('nov/2025 – set/2026');
    expect(experience).not.toContain('– atual');
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
