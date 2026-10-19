import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SourceError } from '../../src/lib/now/http';
import { fetchActiveRepos, fetchLastCommit, linkForRepo, parseActiveRepos } from '../../src/lib/now/github';

const NOW = new Date('2026-10-11T12:00:00Z');
const EXCLUDE = ['DOTFILES'];

const fixture = JSON.parse(readFileSync(new URL('./fixtures/github-repos.json', import.meta.url), 'utf8'));

const repo = (name: string, daysAgo: number) => ({
  name,
  html_url: `https://github.com/nandomoreirame/${name}`,
  description: null,
  language: 'TypeScript',
  pushed_at: new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
  fork: false,
  archived: false,
  private: false,
});

describe('parseActiveRepos', () => {
  it('keeps the three public repos pushed inside the window, newest first', () => {
    expect(parseActiveRepos(fixture, { now: NOW, exclude: EXCLUDE })).toEqual([
      {
        name: 'alpha',
        url: 'https://github.com/nandomoreirame/alpha',
        description: 'newest',
        language: 'TypeScript',
        pushedAt: '2026-10-10T12:00:00Z',
      },
      {
        name: 'beta',
        url: 'https://github.com/nandomoreirame/beta',
        description: null,
        language: null,
        pushedAt: '2026-10-05T12:00:00Z',
      },
      {
        name: 'gamma',
        url: 'https://github.com/nandomoreirame/gamma',
        description: 'oldest valid',
        language: 'Python',
        pushedAt: '2026-09-20T12:00:00Z',
      },
    ]);
  });

  it('caps the list at five', () => {
    const repos = Array.from({ length: 7 }, (_, index) => repo(`repo-${index}`, index));
    expect(parseActiveRepos(repos, { now: NOW, exclude: [] }).map(item => item.name)).toEqual([
      'repo-0',
      'repo-1',
      'repo-2',
      'repo-3',
      'repo-4',
    ]);
  });

  it('returns an empty list when nothing was pushed inside the window', () => {
    expect(parseActiveRepos([repo('ancient', 40)], { now: NOW, exclude: [] })).toEqual([]);
  });

  it('drops a repo whose url is outside https://github.com and keeps the others', () => {
    const evil = repo('evil', 0);
    evil.html_url = 'javascript:alert(1)';
    const kept = repo('kept', 1);

    expect(parseActiveRepos([evil, kept], { now: NOW, exclude: [] }).map(item => item.name)).toEqual(['kept']);
  });
});

describe('linkForRepo', () => {
  it('points at the case page when the repo URL matches, ignoring case and a trailing slash', () => {
    expect(
      linkForRepo({ url: 'https://github.com/nandomoreirame/Forja' }, [
        {
          slug: 'forja',
          block: 'systems-cli',
          repoUrl: 'https://github.com/nandomoreirame/forja/',
        },
      ]),
    ).toBe('/lab/forja');
  });
});

describe('fetchActiveRepos', () => {
  it('omits authorization without a token and sends Bearer when one is present', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });

    await fetchActiveRepos({ fetch: fetchImpl, now: NOW, exclude: [] });
    const withoutToken = new Headers((fetchImpl.mock.calls[0]?.[1] as RequestInit).headers);
    expect(withoutToken.get('accept')).toBe('application/vnd.github+json');
    expect(withoutToken.get('user-agent')).toBe('nandomoreira.dev');
    expect(withoutToken.has('authorization')).toBe(false);

    await fetchActiveRepos({ fetch: fetchImpl, token: 'ghp_test', now: NOW, exclude: [] });
    const withToken = new Headers((fetchImpl.mock.calls[1]?.[1] as RequestInit).headers);
    expect(withToken.get('authorization')).toBe('Bearer ghp_test');
  });

  it('surfaces a 403 rate limit as SourceError without reading it as a repo list', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ message: 'API rate limit exceeded' }),
    });

    await expect(fetchActiveRepos({ fetch: fetchImpl, now: NOW, exclude: [] })).rejects.toMatchObject({
      name: 'Error',
      status: 403,
    });
    await expect(fetchActiveRepos({ fetch: fetchImpl, now: NOW, exclude: [] })).rejects.toBeInstanceOf(SourceError);
  });

  it('rejects a payload that is not a list of repositories', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'API rate limit exceeded' }),
    });

    await expect(fetchActiveRepos({ fetch: fetchImpl, now: NOW, exclude: [] })).rejects.toMatchObject({
      reason: 'shape',
    });
  });
});

describe('fetchLastCommit', () => {
  const commit = [
    {
      sha: '91c9da421ef64a24cc7310a7184f1fc1764b2b69',
      html_url: 'https://github.com/nandomoreirame/nandomoreira.dev/commit/91c9da4',
      commit: { message: '✨ feat(about): merge related jobs\n\nbody that stays out', committer: { date: '2026-10-19T15:30:06Z' } },
    },
  ];

  it('reads the latest commit of a repo: first line of the message, date and link', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify(commit)));
    const last = await fetchLastCommit({
      fetch: fetchImpl as unknown as typeof fetch,
      repo: { name: 'nandomoreira.dev', url: 'https://github.com/nandomoreirame/nandomoreira.dev' },
    });
    expect(last).toEqual({
      repo: 'nandomoreira.dev',
      message: '✨ feat(about): merge related jobs',
      url: 'https://github.com/nandomoreirame/nandomoreira.dev/commit/91c9da4',
      committedAt: '2026-10-19T15:30:06Z',
    });
    expect(String((fetchImpl.mock.calls[0] as unknown as [string])[0])).toBe(
      'https://api.github.com/repos/nandomoreirame/nandomoreira.dev/commits?per_page=1',
    );
  });

  it('refuses a link outside github.com and an empty history', async () => {
    const outside = [{ ...commit[0], html_url: 'https://evil.example/commit/1' }];
    await expect(
      fetchLastCommit({ fetch: vi.fn(async () => new Response(JSON.stringify(outside))) as unknown as typeof fetch, repo: { name: 'x', url: 'https://github.com/nandomoreirame/x' } }),
    ).rejects.toThrow();
    await expect(
      fetchLastCommit({ fetch: vi.fn(async () => new Response('[]')) as unknown as typeof fetch, repo: { name: 'x', url: 'https://github.com/nandomoreirame/x' } }),
    ).rejects.toThrow();
  });
});

