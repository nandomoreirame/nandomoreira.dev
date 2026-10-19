import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ReleasesPage from '../../src/pages/releases.astro';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { SITE_VERSIONS } from '../../src/lib/history/history';
import { RELEASES, RELEASES_PATH, releaseAnchor, releaseTocLabelOf, releasesMarkdown } from '../../src/lib/releases/releases';

const site = new URL('https://nandomoreira.dev');

/** Astro's text escaping, so a highlight is found as the page prints it. */
const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(ReleasesPage, { request: new Request(`https://nandomoreira.dev${RELEASES_PATH}`) });
};

describe('releases data', () => {
  it('lives at /releases', () => {
    expect(RELEASES_PATH).toBe('/releases');
  });

  it('keeps one release per day of work, newest first, since the first commit', () => {
    const dates = RELEASES.map(release => release.date);

    expect(dates.at(-1)).toBe('2026-08-08');
    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(dates).size).toBe(dates.length);
  });

  it('tags every release like the footer, with the commit count growing day by day', () => {
    const counts = RELEASES.map(release => {
      expect(release.version).toMatch(new RegExp(`^v${SITE_VERSIONS.length}\\.\\d+$`));
      return Number(release.version.split('.')[1]);
    });

    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    expect(new Set(counts).size).toBe(counts.length);
  });

  it('sums each day up in a few macro features, in plain prose', () => {
    for (const release of RELEASES) {
      expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(release.title.trim()).not.toBe('');
      expect(release.summary).not.toMatch(/[—–]/);
      expect(release.highlights.length).toBeGreaterThanOrEqual(2);
      expect(release.highlights.length).toBeLessThanOrEqual(6);
      for (const item of release.highlights) expect(item).not.toMatch(/[—–]/);
    }
  });

  it('gives every day a unique anchor', () => {
    const ids = RELEASES.map(releaseAnchor);

    expect(new Set(ids).size).toBe(ids.length);
    expect(releaseAnchor({ date: '2026-10-19' })).toBe('dia-2026-10-19');
  });
});

describe('releaseTocLabelOf', () => {
  it('reads as the short day and the tag', () => {
    expect(releaseTocLabelOf({ date: '2026-10-19', version: 'v17.753' })).toBe('19 out · v17.753');
    expect(releaseTocLabelOf({ date: '2026-08-08', version: 'v17.1' })).toBe('8 ago · v17.1');
  });
});

describe('releases surfaces', () => {
  it('renders the days as one timeline, with every feature', async () => {
    const html = await render();
    const timeline = html.slice(html.indexOf('data-release-timeline'));

    expect(html).toContain('data-release-timeline');
    for (const release of RELEASES) {
      expect(timeline).toContain(`id="${releaseAnchor(release)}"`);
      expect(timeline).toContain(`datetime="${release.date}"`);
      expect(timeline).toContain(release.version);
      for (const item of release.highlights) expect(timeline).toContain(escapeHtml(item));
    }
  });

  it('shows the version you are on between the title and the lead', async () => {
    const html = await render();
    const tag = html.indexOf('data-version-tag');

    expect(html.search(/<h1/)).toBeLessThan(tag);
    expect(tag).toBeLessThan(html.indexOf('data-page-lead'));
    expect(html.slice(tag, html.indexOf('</p>', tag))).toMatch(/v\d+\.\d+\b/);
  });

  it('indexes every day in the side column, newest first, as date and tag', async () => {
    const html = await render();
    const toc = html.match(/<nav[^>]*data-toc[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const positions = RELEASES.map(release => toc.indexOf(`href="#${releaseAnchor(release)}"`));

    expect(html).toContain('data-toc-layout');
    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(toc).toContain(releaseTocLabelOf(RELEASES[0]!));
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
