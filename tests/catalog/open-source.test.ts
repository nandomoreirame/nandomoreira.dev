import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import OpenSourceList from '../../src/components/catalog/OpenSourceList.astro';
import { GITHUB_REPOSITORIES_URL, OPEN_SOURCE_REPOS } from '../../src/lib/catalog/open-source';

const caseRepos = readdirSync('src/content/projects')
  .filter(file => file.endsWith('.md'))
  .map(file => readFileSync(join('src/content/projects', file), 'utf8').match(/^repoUrl:\s*(\S+)/m)?.[1])
  .filter((url): url is string => Boolean(url) && url !== 'null');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(OpenSourceList, { props: {} });
};

describe('open-source list data', () => {
  it('is a short list, not the whole GitHub profile', () => {
    expect(OPEN_SOURCE_REPOS.length).toBeGreaterThanOrEqual(4);
    expect(OPEN_SOURCE_REPOS.length).toBeLessThanOrEqual(10);
  });

  it('only points at public repositories of the profile', () => {
    for (const repo of OPEN_SOURCE_REPOS) {
      expect(repo.url).toMatch(/^https:\/\/github\.com\/nandomoreirame\/[A-Za-z0-9._-]+$/);
    }
  });

  it('never repeats a project that already has a case', () => {
    for (const repo of OPEN_SOURCE_REPOS) expect(caseRepos).not.toContain(repo.url);
  });

  it('describes each repository in Portuguese, with its language and year', () => {
    for (const repo of OPEN_SOURCE_REPOS) {
      expect(repo.description.length).toBeGreaterThan(10);
      expect(repo.language.length).toBeGreaterThan(0);
      expect(repo.year).toMatch(/^(19|20)\d{2}$/);
    }
  });

  // RISK-004: the stars of the 2018 Jekyll themes would read as AI work.
  it('carries no star count', () => {
    for (const repo of OPEN_SOURCE_REPOS) expect(Object.keys(repo)).not.toContain('stars');
  });

  it('links to the full repository list on GitHub', () => {
    expect(GITHUB_REPOSITORIES_URL).toBe('https://github.com/nandomoreirame?tab=repositories');
  });
});

describe('OpenSourceList', () => {
  it('opens with a section heading and lists every repository as a link', async () => {
    const html = await render();

    expect(html).toMatch(/<section[^>]*aria-labelledby="open-source-heading"/);
    expect(html).toMatch(/<h2[^>]*id="open-source-heading"[^>]*>\s*Outros projetos abertos/);
    for (const repo of OPEN_SOURCE_REPOS) expect(html).toContain(`href="${repo.url}"`);
  });

  it('makes the whole row the link, like the posts list', async () => {
    const html = await render();

    for (const repo of OPEN_SOURCE_REPOS) {
      const start = html.indexOf(`href="${repo.url}"`);
      const row = html.slice(start, html.indexOf('</a>', start));
      expect(row).toContain(repo.description);
      expect(row).toContain(repo.year);
      expect(row).toContain(repo.language);
    }
    expect(html.match(new RegExp('href="https://github.com/nandomoreirame/', 'g'))).toHaveLength(
      OPEN_SOURCE_REPOS.length,
    );
  });

  it('opens every GitHub link in a new tab, without passing ranking or the opener', async () => {
    const html = await render();
    const links = html.match(/<a\b[^>]*href="https:\/\/github\.com[^"]*"[^>]*>/g) ?? [];

    expect(links).toHaveLength(OPEN_SOURCE_REPOS.length + 1);
    for (const link of links) {
      expect(link).toContain('target="_blank"');
      expect(link).toMatch(/rel="[^"]*\bnofollow\b[^"]*"/);
      expect(link).toMatch(/rel="[^"]*\bnoopener\b[^"]*"/);
    }
  });

  it('closes with a link to the GitHub profile', async () => {
    const html = await render();
    expect(html).toContain(`href="${GITHUB_REPOSITORIES_URL.replace('?', '?').replace('&', '&amp;')}"`);
    expect(html).toContain('Ver todos no GitHub');
  });
});

describe('/lab page', () => {
  it('renders the open-source list after the cases', () => {
    const source = readFileSync('src/pages/lab/index.astro', 'utf8');
    expect(source).toContain('<OpenSourceList');
    expect(source.indexOf('<OpenSourceList')).toBeGreaterThan(source.indexOf('<CollectionListing'));
  });

  it('keeps the list in the AI view of the lab, from the same source', () => {
    const registry = readFileSync('src/lib/ai-view/registry.ts', 'utf8');
    expect(registry).toContain('OPEN_SOURCE_REPOS');
  });
});

describe('lab markdown', () => {
  it('lists the open repositories and the GitHub link after the cases', async () => {
    const { collectionMarkdown } = await import('../../src/lib/ai-view/pages');
    const text = collectionMarkdown({
      site: new URL('https://nandomoreira.dev'),
      collection: 'lab',
      title: 'Lab',
      description: 'd',
      projects: [],
      openSource: OPEN_SOURCE_REPOS,
    });

    expect(text).toContain('## Outros projetos abertos');
    for (const repo of OPEN_SOURCE_REPOS) expect(text).toContain(`[${repo.name}](${repo.url})`);
    expect(text).toContain(GITHUB_REPOSITORIES_URL);
  });

  it('adds nothing when no list is given, as for the portfolio', async () => {
    const { collectionMarkdown } = await import('../../src/lib/ai-view/pages');
    const text = collectionMarkdown({
      site: new URL('https://nandomoreira.dev'),
      collection: 'portfolio',
      title: 'Portfólio',
      description: 'd',
      projects: [],
    });
    expect(text).not.toContain('Outros projetos abertos');
  });
});
