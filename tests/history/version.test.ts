import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import VersionPage from '../../src/pages/releases/index.astro';
import { buildAiIndex } from '../../src/lib/aeo/ai-index';
import { buildSitemap } from '../../src/lib/aeo/sitemap';
import { markdownForPath } from '../../src/lib/ai-view/registry';
import { getProfile } from '../../src/lib/content';
import {
  HISTORY_PATH,
  FIRST_COMMIT_AT,
  RECORDED_COMMITS,
  SITE_VERSIONS,
  historyMarkdown,
  siteAgeYears,
  siteVersionTag,
  stackTimeline,
  tocLabelOf,
} from '../../src/lib/history/history';

const site = new URL('https://nandomoreira.dev');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(VersionPage, { request: new Request(`https://nandomoreira.dev${HISTORY_PATH}`) });
};

describe('site versions', () => {
  it('lives at /releases', () => {
    expect(HISTORY_PATH).toBe('/releases');
  });

  it('numbers the versions 1..n in order, the current one last', () => {
    SITE_VERSIONS.forEach((version, index) => expect(version.number).toBe(index + 1));
    expect(SITE_VERSIONS.at(-1)?.repo).toBe('nandomoreira.dev');
    expect(SITE_VERSIONS.at(-2)?.repo).toBe('nandomoreira.dev-chat');
  });

  it('starts with the Jekyll theme of 2015', () => {
    expect(SITE_VERSIONS[0]).toMatchObject({ repo: 'nandomoreira-jekyll-theme', start: '2015-11' });
  });

  it('keeps the versions in the order they started', () => {
    const starts = SITE_VERSIONS.map(version => version.start);
    expect(starts).toEqual([...starts].sort());
  });

  it('gives every version a summary, a stack and a GitHub repository', () => {
    for (const version of SITE_VERSIONS) {
      expect(version.summary.length).toBeGreaterThan(20);
      expect(version.summary).not.toMatch(/[—–]/);
      expect(version.stack.length).toBeGreaterThan(0);
      expect(version.commits).toBeGreaterThan(0);
      expect(version.start).toMatch(/^\d{4}-\d{2}$/);
      if (version.end) expect(version.end >= version.start).toBe(true);
    }
  });

  it('leaves only the current version open', () => {
    expect(SITE_VERSIONS.filter(version => !version.end).map(version => version.repo)).toEqual(['nandomoreira.dev']);
  });
});

describe('stackTimeline', () => {
  it('lists every technology once, in the version it first appeared', () => {
    const timeline = stackTimeline();
    const names = timeline.map(entry => entry.name);

    expect(new Set(names).size).toBe(names.length);
    expect(timeline[0]).toMatchObject({ name: 'Jekyll', firstVersion: 1 });
    expect(timeline.find(entry => entry.name === 'Astro')?.firstVersion).toBe(SITE_VERSIONS.length);
  });

  it('counts how many versions used each technology', () => {
    const jekyll = stackTimeline().find(entry => entry.name === 'Jekyll');
    const expected = SITE_VERSIONS.filter(version => version.stack.includes('Jekyll')).length;

    expect(jekyll?.versions).toBe(expected);
    expect(expected).toBeGreaterThan(1);
  });
});

describe('version tag', () => {
  it('is v<versions>.<commits of this repository>', () => {
    expect(siteVersionTag(812)).toBe(`v${SITE_VERSIONS.length}.812`);
  });
});

describe('site age', () => {
  it('starts at the first commit of the first repository', () => {
    expect(FIRST_COMMIT_AT).toBe('2015-11-12T18:44:48Z');
  });

  it('counts whole years, turning on the anniversary of the first commit', () => {
    expect(siteAgeYears(new Date('2026-10-19T12:00:00Z'))).toBe(10);
    expect(siteAgeYears(new Date('2026-11-12T18:44:47Z'))).toBe(10);
    expect(siteAgeYears(new Date('2026-11-12T18:44:48Z'))).toBe(11);
    expect(siteAgeYears(new Date('2030-01-01T00:00:00Z'))).toBe(14);
  });
});

describe('history markdown', () => {
  it('tells every version with its stack', () => {
    const markdown = historyMarkdown({ site, commits: 800, now: new Date('2026-10-19T12:00:00Z') });

    expect(markdown).toContain('# Esse site faz 10 anos desde o primeiro commit 🎈');
    expect(markdown).toContain('url: https://nandomoreira.dev/releases');
    for (const version of SITE_VERSIONS) {
      expect(markdown).toContain(`github.com/nandomoreirame/${version.repo}`);
      for (const tech of version.stack) expect(markdown).toContain(tech);
    }
  });

  it('is served by the AI view registry', async () => {
    const page = await markdownForPath(site, 'releases');

    expect(page?.humanPath).toBe('/releases');
    expect(page?.mdPath).toBe('/releases.md');
  });

  it('is listed in the sitemap and the AI index', async () => {
    const profile = await getProfile();

    expect(buildSitemap({ site, projects: [] })).toContain('<loc>https://nandomoreira.dev/releases</loc>');
    expect(buildAiIndex({ site, profile, projects: [] }).entries.map(entry => entry.url)).toContain(
      'https://nandomoreira.dev/releases',
    );
  });
});

describe('tocLabelOf', () => {
  it('reads as the start month and the main stack', () => {
    expect(tocLabelOf({ start: '2015-11', name: 'Jekyll' })).toBe('nov/2015 · Jekyll');
  });
});

describe('history page', () => {
  it('indexes every version under Versões, newest first, linked to its entry', async () => {
    const html = await render();
    const toc = html.match(/<nav[^>]*data-toc[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
    const positions = SITE_VERSIONS.map(version => toc.indexOf(`href="#versao-${version.number}"`));

    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => b - a));
    expect(toc).toContain(tocLabelOf(SITE_VERSIONS[0]!));
    for (const version of SITE_VERSIONS) expect(html).toContain(`id="versao-${version.number}"`);
  });

  it('keeps the version number out of the timeline', async () => {
    const html = await render();
    const timeline = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/)?.[1] ?? '';

    expect(timeline).not.toMatch(/>\s*v\d+\s*</);
  });

  it('shows every version, newest first, with a link to its repository', async () => {
    const html = await render();
    const positions = SITE_VERSIONS.map(version => html.indexOf(`github.com/nandomoreirame/${version.repo}"`));

    for (const position of positions) expect(position).toBeGreaterThan(-1);
    expect(positions).toEqual([...positions].sort((a, b) => b - a));
  });

  it('titles the page with the age of the site, counted at request time', async () => {
    const html = await render();

    expect(html).toMatch(
      new RegExp(`<h1[^>]*>\\s*Esse site faz ${siteAgeYears(new Date())} anos desde o primeiro commit 🎈\\s*</h1>`),
    );
  });

  it('never claims one repository per version', async () => {
    const html = await render();

    expect(html).not.toContain('Cada versão nasceu num repositório novo');
    expect(html).not.toContain('deixaram rastro');
  });

  it('puts the version line between the title and the lead, like the updated-at strip', async () => {
    const html = await render();
    const title = html.search(/<h1/);
    const tag = html.indexOf('data-version-tag');
    const lead = html.indexOf('data-page-lead');

    expect(title).toBeLessThan(tag);
    expect(tag).toBeLessThan(lead);
    expect(html).toMatch(
      /data-version-tag[^>]*border-l-2 border-primary|border-l-2 border-primary[^>]*data-version-tag/,
    );
  });

  it('follows the version tag with the link to its releases, not the commit counts', async () => {
    const html = await render();
    const line = html.match(/<p[^>]*data-version-tag[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '';

    expect(line).toMatch(/v\d+\.\d+\b/);
    expect(line).toContain('href="/releases/17"');
    expect(line).not.toContain('somando todos');
  });

  it('shows the version tag and the technologies that passed through', async () => {
    const html = await render();

    expect(html).toMatch(/v\d+\.\d+\b/);
    for (const entry of stackTimeline()) expect(html).toContain(entry.name);
  });

  it('points the previews at a live https copy, the old ones that are already up included', () => {
    const previews = Object.fromEntries(
      SITE_VERSIONS.filter(version => version.preview).map(version => [version.number, version.preview]),
    );

    expect(previews[1]).toBe('https://nandomoreirame.github.io/nandomoreira-jekyll-theme/');
    expect(previews[5]).toBe('https://nandomoreirame.github.io/middleman-blog/');
    expect(previews[6]).toBe('https://old-nandomoreirame.netlify.app/');
    for (const url of Object.values(previews)) expect(url).toMatch(/^https:\/\//);
    expect(SITE_VERSIONS.at(-1)?.preview).toBeUndefined();
  });

  it('puts a Preview button beside the repository of every version that has one, opening a new tab', async () => {
    const html = await render();
    const buttons = html.match(/<a[^>]*data-version-preview[^>]*>[\s\S]*?<\/a>/g) ?? [];

    expect(buttons).toHaveLength(SITE_VERSIONS.filter(version => version.preview).length);
    for (const button of buttons) {
      expect(button).toContain('target="_blank"');
      expect(button).toContain('rel="noopener noreferrer"');
      expect(button).toMatch(/>\s*Preview\s*</);
      expect(button).toMatch(/aria-label="Preview da v\d+ \(abre em nova guia\)"/);
    }
  });

  it('lists the preview in the markdown of the versions', () => {
    const markdown = historyMarkdown({ site, commits: 800, now: new Date('2026-10-19T12:00:00Z') });

    expect(markdown).toContain('- Preview: https://nandomoreirame.github.io/nandomoreira-jekyll-theme/');
  });

  it('opens the repositories outside the site without vouching for them', async () => {
    const links = (await render()).match(/<a[^>]*href="https:\/\/github\.com\/nandomoreirame\/[^"]*"[^>]*>/g) ?? [];

    expect(links.length).toBeGreaterThanOrEqual(SITE_VERSIONS.length);
    for (const link of links) expect(link).toContain('rel="noopener noreferrer"');
  });
});
