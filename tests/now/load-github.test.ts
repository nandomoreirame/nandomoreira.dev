import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { readNowConfig } from '../../src/lib/now/config';
import { createNowLoader } from '../../src/lib/now/load';

const repos = JSON.parse(readFileSync(new URL('./fixtures/github-repos.json', import.meta.url), 'utf8'));
const NOW = () => Date.parse('2026-10-11T12:00:00Z');

const calendar = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 12,
          weeks: [
            { contributionDays: [{ date: '2026-10-10', contributionCount: 12, contributionLevel: 'FOURTH_QUARTILE' }] },
          ],
        },
      },
    },
  },
};

const commit = (date: string) => [
  {
    html_url: 'https://github.com/nandomoreirame/x/commit/1',
    commit: { message: 'fix: something\n\nbody', committer: { date } },
  },
];

const fetchWith = (overrides: { graphql?: () => Response; commits?: () => Response } = {}) =>
  vi.fn(async (url: string) => {
    const target = String(url);
    if (target.endsWith('/graphql')) return overrides.graphql?.() ?? new Response(JSON.stringify(calendar));
    if (target.includes('/commits?per_page=1'))
      return overrides.commits?.() ?? new Response(JSON.stringify(commit('2026-10-11T10:00:00Z')));
    if (target.includes('/users/nandomoreirame/repos')) return new Response(JSON.stringify(repos));
    throw new Error(`unexpected ${target}`);
  });

const loader = (fetchImpl: ReturnType<typeof fetchWith>, token?: string) =>
  createNowLoader({
    config: readNowConfig(token ? { GITHUB_TOKEN: token } : {}),
    fetch: fetchImpl as unknown as typeof fetch,
    now: NOW,
    logger: { warn: vi.fn() },
    fallbackGames: [],
    currentPosts: async () => [],
  });

describe('loadNow GitHub work', () => {
  it('reads the contribution calendar with a token, and the last commit of the latest repo', async () => {
    const fetchImpl = fetchWith();
    const data = await loader(fetchImpl, 'ghp_x')();
    expect(data.contributions).toMatchObject({ state: 'ok', items: { total: 12 } });
    expect(data.lastCommit).toMatchObject({ message: 'fix: something', committedAt: '2026-10-11T10:00:00Z' });
    expect(data.projects.state).toBe('ok');
    if (data.projects.state === 'ok') expect(data.lastCommit?.repo).toBe(data.projects.items[0]!.name);
  });

  it('leaves the calendar out without a token, and never calls GraphQL', async () => {
    const fetchImpl = fetchWith();
    const data = await loader(fetchImpl)();
    expect(data.contributions.state).toBe('empty');
    expect(fetchImpl.mock.calls.some(call => String(call[0]).endsWith('/graphql'))).toBe(false);
    expect(data.lastCommit).toBeDefined();
  });

  it('keeps the repos when the last commit or the calendar fails', async () => {
    const fetchImpl = fetchWith({
      graphql: () => new Response('{}', { status: 401 }),
      commits: () => new Response('[]'),
    });
    const data = await loader(fetchImpl, 'ghp_x')();
    expect(data.projects.state).toBe('ok');
    expect(data.lastCommit).toBeUndefined();
    expect(data.contributions.state).toBe('empty');
  });

  it('dates the page with the last commit when it is the newest thing', async () => {
    const data = await loader(
      fetchWith({ commits: () => new Response(JSON.stringify(commit('2026-12-01T12:00:00Z'))) }),
    )();
    expect(data.updatedAt).toBe('2026-12-01');
  });
});
