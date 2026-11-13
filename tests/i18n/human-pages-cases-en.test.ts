import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../../src/components/pages/AboutPage.astro';
import HomePage from '../../src/components/pages/HomePage.astro';
import NowPage from '../../src/components/pages/NowPage.astro';
import { collectionOfBlock } from '../../src/lib/catalog/groups';
import { getAllProjects, getProfile } from '../../src/lib/content';
import { resetLoadNowForTests } from '../../src/lib/now/load';
import { ptLeftovers } from '../helpers/pt-leftovers';

process.env.SPOTIFY_CLIENT_ID ??= 'cid';
process.env.SPOTIFY_CLIENT_SECRET ??= 'sec';
process.env.SPOTIFY_REFRESH_TOKEN ??= 'ref';
process.env.GITHUB_TOKEN ??= 'ghp_test';

const fixtureRepos = JSON.parse(
  readFileSync(new URL('../now/fixtures/github-repos.json', import.meta.url), 'utf8'),
) as Array<Record<string, unknown>>;

/** A real case repo so /en/now can prove the localized case link. */
const forjaRepo = {
  name: 'forja',
  html_url: 'https://github.com/nandomoreirame/forja',
  description: 'Desktop client for multiple AI CLIs',
  language: 'TypeScript',
  pushed_at: '2026-10-11T18:00:00Z',
  fork: false,
  archived: false,
  private: false,
};

const calendar = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 12,
          weeks: [
            {
              contributionDays: [{ date: '2026-10-10', contributionCount: 12, contributionLevel: 'FOURTH_QUARTILE' }],
            },
          ],
        },
      },
    },
  },
};

const commitBody = [
  {
    html_url: 'https://github.com/nandomoreirame/forja/commit/1',
    commit: { message: 'feat: one thing', committer: { date: '2026-10-11T12:00:00Z' } },
  },
];

const githubFetch = async (url: string) => {
  const target = String(url);
  if (target.endsWith('/graphql')) return { ok: true, status: 200, json: async () => calendar };
  if (target.includes('/commits?per_page=1')) return { ok: true, status: 200, json: async () => commitBody };
  if (target.includes('/users/nandomoreirame/repos')) {
    return { ok: true, status: 200, json: async () => [forjaRepo, ...fixtureRepos] };
  }
  throw new Error(`offline:${target}`);
};

const servicesRegion = (html: string): string => {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  // Home uses #servicos; about uses #frentes for the same ServiceCards.
  const marker = Math.max(main.indexOf('id="servicos"'), main.indexOf('id="frentes"'));
  expect(marker).toBeGreaterThan(-1);
  return main.slice(main.lastIndexOf('<section', marker));
};

const workingRegion = (html: string): string => {
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  // SectionHeader puts id="projetos" on the h2; the wrapping <section> is earlier.
  const marker = main.indexOf('id="projetos"');
  expect(marker).toBeGreaterThan(-1);
  const start = main.lastIndexOf('<section', marker);
  const next = main.indexOf('id="escrevendo"', marker);
  const end = next === -1 ? main.length : main.lastIndexOf('<section', next);
  return main.slice(start, end);
};

describe('English human pages load localized cases', () => {
  it.each([
    ['HomePage', 'src/components/pages/HomePage.astro'],
    ['AboutPage', 'src/components/pages/AboutPage.astro'],
    ['NowPage', 'src/components/pages/NowPage.astro'],
  ] as const)('%s calls getAllProjects(locale) after the overlays landed', (_label, path) => {
    const source = readFileSync(path, 'utf8');
    expect(source).toContain('getAllProjects(locale)');
    expect(source).not.toMatch(/empty stub|until i18n-content overlays/i);
  });

  it('home proof links use English case paths and no Portuguese case summaries', async () => {
    const [profile, enProjects, ptProjects] = await Promise.all([
      getProfile('en'),
      getAllProjects('en'),
      getAllProjects(),
    ]);
    const html = await (
      await AstroContainer.create()
    ).renderToString(HomePage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en'),
    });
    const region = servicesRegion(html);

    for (const service of profile.services) {
      const project = enProjects.find(entry => entry.slug === service.caseSlug);
      expect(project).toBeDefined();
      const collection = collectionOfBlock(project!.block);
      expect(region).toContain(`href="/en/${collection}/${service.caseSlug}"`);
      const pt = ptProjects.find(entry => entry.slug === service.caseSlug)!;
      expect(region).not.toContain(pt.summary.slice(0, 48));
      expect(region).not.toContain(`href="/${collection}/${service.caseSlug}"`);
    }

    expect(ptLeftovers(region)).toEqual([]);
  });

  it('about proof links use English case paths and no Portuguese case summaries', async () => {
    const [profile, enProjects, ptProjects] = await Promise.all([
      getProfile('en'),
      getAllProjects('en'),
      getAllProjects(),
    ]);
    const html = await (
      await AstroContainer.create()
    ).renderToString(AboutPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/about'),
    });
    const region = servicesRegion(html);

    for (const service of profile.services) {
      const project = enProjects.find(entry => entry.slug === service.caseSlug);
      expect(project).toBeDefined();
      const collection = collectionOfBlock(project!.block);
      expect(region).toContain(`href="/en/${collection}/${service.caseSlug}"`);
      const pt = ptProjects.find(entry => entry.slug === service.caseSlug)!;
      expect(region).not.toContain(pt.summary.slice(0, 48));
      expect(region).not.toContain(`href="/${collection}/${service.caseSlug}"`);
    }

    expect(ptLeftovers(region)).toEqual([]);
  });
});

describe('English now page case links', () => {
  beforeEach(() => {
    resetLoadNowForTests();
    vi.stubGlobal('fetch', vi.fn(githubFetch));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetLoadNowForTests();
  });

  it('links a matched repo to the English case path', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T20:00:00Z'));

    const html = await (
      await AstroContainer.create()
    ).renderToString(NowPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/now'),
    });
    const region = workingRegion(html);

    expect(region).toContain('href="/en/lab/forja"');
    expect(region).not.toContain('href="/lab/forja"');
    expect(region).not.toContain('href="https://github.com/nandomoreirame/forja"');
    expect(ptLeftovers(region.replace(/nownownow\.com/gi, ' '))).toEqual([]);
  });
});
