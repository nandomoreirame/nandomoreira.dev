import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ReleasesPage from '../../src/pages/releases.astro';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { SITE_VERSIONS } from '../../src/lib/history/history';
import { RELEASES, RELEASES_PATH, releasesMarkdown } from '../../src/lib/releases/releases';

const site = new URL('https://nandomoreira.dev');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(ReleasesPage, { request: new Request(`https://nandomoreira.dev${RELEASES_PATH}`) });
};

describe('releases data', () => {
  it('lives at /releases', () => {
    expect(RELEASES_PATH).toBe('/releases');
  });

  it('starts with one release for the current version, tagged like the footer', () => {
    expect(RELEASES).toHaveLength(1);
    expect(RELEASES[0]?.version).toMatch(new RegExp(`^v${SITE_VERSIONS.length}\\.\\d+$`));
  });

  it('dates every release and groups its features, in plain prose', () => {
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.summary).not.toMatch(/[—–]/);
      expect(release.groups.length).toBeGreaterThan(3);
      for (const group of release.groups) {
        expect(group.title.trim()).not.toBe('');
        expect(group.items.length).toBeGreaterThan(0);
        for (const item of group.items) expect(item).not.toMatch(/[—–]/);
      }
    }
  });

  it('gives every group a unique anchor', () => {
    const ids = RELEASES.flatMap(release => release.groups.map(group => group.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('releases surfaces', () => {
  it('renders every release with all of its features', async () => {
    const html = await render();

    for (const release of RELEASES) {
      expect(html).toContain(release.version);
      for (const group of release.groups) {
        expect(html).toContain(`id="${group.id}"`);
        expect(html).toContain(group.title);
      }
    }
  });

  it('shows the version you are on between the title and the lead', async () => {
    const html = await render();
    const tag = html.indexOf('data-version-tag');

    expect(html.search(/<h1/)).toBeLessThan(tag);
    expect(tag).toBeLessThan(html.indexOf('data-page-lead'));
    expect(html.slice(tag, html.indexOf('</p>', tag))).toMatch(/v\d+\.\d+\b/);
  });

  it('links back to the story of every version', async () => {
    expect(await render()).toContain('href="/version"');
  });

  it('has an AI view and a sitemap entry', async () => {
    const page = await markdownForPath(site, 'releases');

    expect(page?.mdPath).toBe('/releases.md');
    expect(page?.markdown).toBe(releasesMarkdown({ site }));
    expect(buildSitemap({ site, projects: [] })).toContain('https://nandomoreira.dev/releases');
  });
});
