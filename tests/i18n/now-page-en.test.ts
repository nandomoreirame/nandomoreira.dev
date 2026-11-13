import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NowPage from '../../src/components/pages/NowPage.astro';
import { resetLoadNowForTests } from '../../src/lib/now/load';
import { ptLeftovers } from '../helpers/pt-leftovers';

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

const githubFetch = async (url: string) => {
  const target = String(url);
  if (target.endsWith('/graphql')) return { ok: true, status: 200, json: async () => calendar };
  if (target.includes('/commits?per_page=1')) return { ok: true, status: 200, json: async () => commitBody };
  if (target.includes('/users/nandomoreirame/repos')) return { ok: true, status: 200, json: async () => repos };
  throw new Error(`offline:${target}`);
};

const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(githubFetch);

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(NowPage, {
    props: { locale },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en/now' : 'https://nandomoreira.dev/now'),
  });

describe('NowPage', () => {
  beforeEach(() => {
    resetLoadNowForTests();
    fetchImpl.mockReset();
    fetchImpl.mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetLoadNowForTests();
  });

  it('keeps the pt-BR now page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/now.pt.html');
  });

  it('renders the whole English now page, including curated copy, writing and GitHub', async () => {
    resetLoadNowForTests();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T15:00:00Z'));
    fetchImpl.mockReset();
    fetchImpl.mockImplementation(githubFetch);
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');

    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(main).toContain('End-to-end product');
    expect(main).toContain('hybrid search');
    expect(main).toContain('Last commit');
    expect(main).toMatch(/<time datetime="2026-10-10">October 10, 2026<\/time>/);
    expect(main).toContain('href="/en/ai-harness-with-rpi"');
    expect(main).toContain('My AI harness with RPI');
    expect(main).not.toContain('Produto de ponta a ponta');
    expect(main).not.toContain('Último commit');
    expect(main).not.toContain('/en/meu-harness-de-ia-com-rpi');

    // Chrome still ships the language suggestion in the other language by design.
    const cleaned = main
      .replace(/<aside\b[^>]*\bdata-lang-suggest\b[^>]*>[\s\S]*?<\/aside>/gi, ' ')
      .replace(/nownownow\.com/gi, ' ');
    expect(ptLeftovers(cleaned)).toEqual([]);
  });
});
