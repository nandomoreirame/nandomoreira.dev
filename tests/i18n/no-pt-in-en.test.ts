import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../../src/components/pages/AboutPage.astro';
import CollectionPage from '../../src/components/pages/CollectionPage.astro';
import ContactPage from '../../src/components/pages/ContactPage.astro';
import HomePage from '../../src/components/pages/HomePage.astro';
import McpPage from '../../src/components/pages/McpPage.astro';
import NotFoundPage from '../../src/components/pages/NotFoundPage.astro';
import NowPage from '../../src/components/pages/NowPage.astro';
import PostsPage from '../../src/components/pages/PostsPage.astro';
import PrivacyPage from '../../src/components/pages/PrivacyPage.astro';
import ResumePage from '../../src/components/pages/ResumePage.astro';
import SetupPage from '../../src/components/pages/SetupPage.astro';
import { resetLoadNowForTests } from '../../src/lib/now/load';
import PostPage from '../../src/components/pages/PostPage.astro';
import { getAllPostEntries } from '../../src/lib/content';
import { ptHiddenLeftovers, ptLeftovers } from '../helpers/pt-leftovers';

process.env.SPOTIFY_CLIENT_ID ??= 'cid';
process.env.SPOTIFY_CLIENT_SECRET ??= 'sec';
process.env.SPOTIFY_REFRESH_TOKEN ??= 'ref';
process.env.GITHUB_TOKEN ??= 'ghp_test';

const repos = JSON.parse(readFileSync(new URL('../now/fixtures/github-repos.json', import.meta.url), 'utf8'));

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
    html_url: 'https://github.com/nandomoreirame/alpha/commit/1',
    commit: { message: 'feat: one thing\n\nbody', committer: { date: '2026-10-10T12:00:00Z' } },
  },
];

const nowFetch = async (url: string) => {
  const target = String(url);
  if (target.endsWith('/graphql')) return { ok: true, status: 200, json: async () => calendar };
  if (target.includes('/commits?per_page=1')) return { ok: true, status: 200, json: async () => commitBody };
  if (target.includes('/users/nandomoreirame/repos')) return { ok: true, status: 200, json: async () => repos };
  throw new Error('offline');
};

const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(async () => {
  throw new Error('offline');
});

const PAGES = [
  ['/en', HomePage, {}],
  ['/en/about', AboutPage, {}],
  ['/en/contact', ContactPage, {}],
  ['/en/resume', ResumePage, {}],
  ['/en/mcp', McpPage, {}],
  ['/en/setup', SetupPage, {}],
  ['/en/now', NowPage, {}],
  ['/en/privacy', PrivacyPage, {}],
  ['/en/posts', PostsPage, {}],
  ['/en/portfolio', CollectionPage, { collection: 'portfolio' }],
  ['/en/lab', CollectionPage, { collection: 'lab' }],
  ['/en/missing', NotFoundPage, {}],
] as const;

/** Drop intentional Portuguese that is not interface copy (REQ-008). */
const withoutIntentionalContent = (_url: string, html: string): string => {
  // When EN_LIVE is on, the suggestion is written in the other language by design (REQ-018).
  return html.replace(/<aside\b[^>]*\bdata-lang-suggest\b[^>]*>[\s\S]*?<\/aside>/gi, ' ');
};

describe('English pages carry no Portuguese interface text', () => {
  beforeEach(() => {
    resetLoadNowForTests();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T15:00:00Z'));
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(async url => {
      if (String(url).includes('github.com') || String(url).endsWith('/graphql')) return nowFetch(url);
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetLoadNowForTests();
  });

  it.each(PAGES)('%s', async (url, component, props) => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(component as never, {
      props: { ...props, locale: 'en' },
      request: new Request(`https://nandomoreira.dev${url}`),
    });
    expect(ptLeftovers(withoutIntentionalContent(url, html))).toEqual([]);
    expect(ptHiddenLeftovers(withoutIntentionalContent(url, html))).toEqual([]);
  });

  it('an English post with code blocks', async () => {
    const entries = await getAllPostEntries('en');
    const entry = entries.find(item => item.body?.includes('```'));
    expect(entry).toBeDefined();
    const html = await (
      await AstroContainer.create()
    ).renderToString(PostPage, {
      props: { entry, locale: 'en' },
      request: new Request(`https://nandomoreira.dev/en/${entry!.data.slug}`),
    });
    const chrome = withoutIntentionalContent('/en/post', html).replace(/<(code|pre)\b[\s\S]*?<\/\1>/gi, ' ');
    // The body is English prose, where "do" is an English word; check the toolbar words instead.
    expect(chrome).not.toMatch(/\bCopia(?:r|do)\b|>texto</);
    expect(ptHiddenLeftovers(chrome)).toEqual([]);
  });

  it('proves the hidden gate can fail', () => {
    expect(ptHiddenLeftovers('<img alt="Foto de alguém">')).not.toEqual([]);
    expect(ptHiddenLeftovers('<a href="https://claude.ai/new?q=Por%20favor%2C%20leia%20o%20artigo">x</a>')).not.toEqual(
      [],
    );
    expect(ptHiddenLeftovers('<a href="/sobre" lang="pt-BR" aria-label="Ler em português">PT</a>')).toEqual([]);
  });

  it('proves the gate can fail', () => {
    expect(ptLeftovers('<p>Ver todos</p>')).not.toEqual([]);
  });
});
