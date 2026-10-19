import { describe, expect, it, vi } from 'vitest';
import { RECORDED_COMMITS } from '../../src/lib/history/history';
import { commitCountFrom, createCommitsLoader, fetchCommitCount } from '../../src/lib/history/commits';

const link = (last: number) =>
  `<https://api.github.com/repositories/1/commits?per_page=1&page=2>; rel="next", <https://api.github.com/repositories/1/commits?per_page=1&page=${last}>; rel="last"`;

const response = (last: number | null, body: unknown[] = [{}]) =>
  new Response(JSON.stringify(body), { headers: last === null ? {} : { link: link(last) } });

describe('commitCountFrom', () => {
  it('reads the count from the last page of a one-per-page listing', () => {
    expect(commitCountFrom(link(812), 1)).toBe(812);
  });

  it('counts the items when there is a single page', () => {
    expect(commitCountFrom(null, 1)).toBe(1);
  });

  it('rejects a header without a last page', () => {
    expect(commitCountFrom('<https://x>; rel="next"', 1)).toBeUndefined();
  });
});

describe('fetchCommitCount', () => {
  it('asks GitHub for one commit per page on main and reads the last page', async () => {
    const fetchImpl = vi.fn(async () => response(812));

    expect(await fetchCommitCount({ fetch: fetchImpl })).toBe(812);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.github.com/repos/nandomoreirame/nandomoreira.dev/commits?sha=main&per_page=1');
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it('sends the token when there is one', async () => {
    const fetchImpl = vi.fn(async () => response(812));

    await fetchCommitCount({ fetch: fetchImpl, token: 't0k' });
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer t0k');
  });

  it('fails on an error status', async () => {
    await expect(fetchCommitCount({ fetch: vi.fn(async () => new Response('', { status: 403 })) })).rejects.toThrow();
  });
});

describe('createCommitsLoader', () => {
  it('serves the GitHub count and caches it', async () => {
    const fetchImpl = vi.fn(async () => response(900));
    const load = createCommitsLoader({ fetch: fetchImpl, now: () => 0 });

    expect(await load()).toBe(900);
    expect(await load()).toBe(900);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back to the recorded count when GitHub fails', async () => {
    const load = createCommitsLoader({
      fetch: vi.fn().mockRejectedValue(new Error('offline')),
      now: () => 0,
      logger: { warn: () => {} },
    });

    expect(await load()).toBe(RECORDED_COMMITS);
  });

  it('falls back when GitHub answers fewer commits than were ever recorded', async () => {
    const load = createCommitsLoader({ fetch: vi.fn(async () => response(3)), now: () => 0 });

    expect(await load()).toBe(RECORDED_COMMITS);
  });
});
