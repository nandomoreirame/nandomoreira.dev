import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { readNowConfig } from '../../src/lib/now/config';
import { createNowLoader } from '../../src/lib/now/load';
import { NOW_FOCUS } from '../../src/lib/now/now';

const readJson = (name: string) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const NOW = () => Date.parse('2026-10-11T12:00:00Z');

const jsonResponse = (body: unknown) => ({
  ok: true,
  status: 200,
  json: async () => body,
});

const fullConfig = {
  GITHUB_TOKEN: 'ghp_test',
  SPOTIFY_CLIENT_ID: 'cid',
  SPOTIFY_CLIENT_SECRET: 'sec',
  SPOTIFY_REFRESH_TOKEN: 'ref',
  OPENXBL_API_KEY: 'xbl_test',
};

const okFetch = () =>
  vi.fn(async (url: string) => {
    const target = String(url);
    if (target.includes('api.github.com')) return jsonResponse(readJson('github-repos.json'));
    if (target.includes('accounts.spotify.com')) return jsonResponse({ access_token: 'access-1' });
    if (target.includes('api.spotify.com')) return jsonResponse(readJson('spotify-recently-played.json'));
    if (target.includes('/v2/presence')) {
      return jsonResponse({
        content: {
          state: 'Online',
          devices: [
            { type: 'Scarlett', titles: [{ name: 'Halo Infinite', placement: 'Full', state: 'Active' }] },
          ],
        },
      });
    }
    if (target.includes('/v2/player/titleHistory')) return jsonResponse(readJson('xbl-title-history.json'));
    throw new Error(`unexpected ${target}`);
  });

describe('readNowConfig', () => {
  it('omits Spotify unless all three variables are present, and never throws', () => {
    expect(readNowConfig({}).spotify).toBeUndefined();
    expect(readNowConfig({ SPOTIFY_CLIENT_ID: 'cid', SPOTIFY_CLIENT_SECRET: 'sec' }).spotify).toBeUndefined();
    expect(
      readNowConfig({
        SPOTIFY_CLIENT_ID: 'cid',
        SPOTIFY_CLIENT_SECRET: 'sec',
        SPOTIFY_REFRESH_TOKEN: 'ref',
      }).spotify,
    ).toEqual({ clientId: 'cid', clientSecret: 'sec', refreshToken: 'ref' });
    expect(() => readNowConfig({ SPOTIFY_CLIENT_ID: 'only-one' })).not.toThrow();
  });
});

describe('loadNow', () => {
  it('does not call Spotify or Xbox without credentials, and survives a GitHub failure', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    const logger = { warn: vi.fn() };
    const loadNow = createNowLoader({ config: readNowConfig({}), fetch: fetchImpl, now: NOW, logger });

    const data = await loadNow();

    expect(data.music.state).toBe('empty');
    expect(data.games.state).toBe('empty');
    expect(data.projects.state).toBe('empty');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    const urls = fetchImpl.mock.calls.map((call) => String(call[0]));
    expect(urls.some((url) => url.includes('spotify.com'))).toBe(false);
    expect(urls.some((url) => url.includes('xbl.io'))).toBe(false);
    expect(data.focus.items).toEqual(NOW_FOCUS);
    expect(data.focus.availability.length).toBeGreaterThan(0);
  });

  it('uses an injected games list when Xbox is off', async () => {
    const fallbackGames = [{ name: 'Hades', note: 'na reserva' }];
    const loadNow = createNowLoader({
      config: readNowConfig({}),
      fetch: vi.fn().mockRejectedValue(new Error('offline')),
      now: NOW,
      logger: { warn: vi.fn() },
      fallbackGames,
    });

    await expect(loadNow()).resolves.toMatchObject({ games: { state: 'fallback', items: fallbackGames } });
  });

  it('marks every configured source ok when each one answers', async () => {
    const loadNow = createNowLoader({
      config: readNowConfig(fullConfig),
      fetch: okFetch() as unknown as typeof fetch,
      now: NOW,
      logger: { warn: vi.fn() },
    });

    const data = await loadNow();

    expect(data.projects.state).toBe('ok');
    expect(data.music.state).toBe('ok');
    expect(data.games.state).toBe('ok');
  });

  it('treats an empty GitHub list as an empty section and does not throw', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (String(url).includes('api.github.com')) return jsonResponse([]);
      throw new Error(`unexpected ${url}`);
    });
    const loadNow = createNowLoader({
      config: readNowConfig({}),
      fetch: fetchImpl as unknown as typeof fetch,
      now: NOW,
      logger: { warn: vi.fn() },
    });

    await expect(loadNow()).resolves.toMatchObject({ projects: { state: 'empty' } });
  });
});
