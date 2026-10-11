import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SourceError } from '../../src/lib/now/http';
import { fetchRecentTracks, parseRecentTracks, refreshAccessToken } from '../../src/lib/now/spotify';

const NOW = new Date('2026-10-11T18:00:00Z');
const fixture = JSON.parse(
  readFileSync(new URL('./fixtures/spotify-recently-played.json', import.meta.url), 'utf8'),
);

describe('parseRecentTracks', () => {
  it('dedupes by track id, keeps the latest play, and caps at five', () => {
    const tracks = parseRecentTracks(fixture, { now: NOW });
    expect(tracks.map((track) => track.title)).toEqual(['Same Song', 'Two', 'Three', 'Four', 'Five']);
    expect(tracks[0]).toEqual({
      title: 'Same Song',
      artists: 'Artist A, Artist B',
      url: 'https://open.spotify.com/track/t1',
      day: 'hoje',
    });
  });

  it('drops a null track without failing the parse', () => {
    const tracks = parseRecentTracks(
      {
        items: [
          { played_at: '2026-10-11T18:00:00Z', track: null },
          fixture.items[3],
        ],
      },
      { now: NOW },
    );
    expect(tracks.map((track) => track.title)).toEqual(['Two']);
  });

  it('drops a track whose url is outside https://open.spotify.com and keeps the others', () => {
    const evil = structuredClone(fixture.items[0]);
    evil.track.id = 'evil';
    evil.track.name = 'Evil';
    evil.track.external_urls.spotify = 'javascript:alert(1)';

    const tracks = parseRecentTracks({ items: [evil, fixture.items[3]] }, { now: NOW });
    expect(tracks.map((track) => track.title)).toEqual(['Two']);
  });
});

describe('refreshAccessToken', () => {
  it('sends Basic auth and a refresh_token grant', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'access-1' }),
    });

    await expect(
      refreshAccessToken({
        fetch: fetchImpl,
        clientId: 'cid',
        clientSecret: 'sec',
        refreshToken: 'ref',
      }),
    ).resolves.toBe('access-1');

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://accounts.spotify.com/api/token');
    const headers = new Headers(init.headers);
    expect(headers.get('content-type')).toBe('application/x-www-form-urlencoded');
    expect(headers.get('authorization')).toBe(`Basic ${Buffer.from('cid:sec').toString('base64')}`);
    expect(String(init.body)).toContain('grant_type=refresh_token');
    expect(String(init.body)).toContain('refresh_token=ref');
  });

  it('turns a 401 from the refresh endpoint into SourceError', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_grant' }),
    });

    await expect(
      refreshAccessToken({
        fetch: fetchImpl,
        clientId: 'cid',
        clientSecret: 'sec',
        refreshToken: 'ref',
      }),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      refreshAccessToken({
        fetch: fetchImpl,
        clientId: 'cid',
        clientSecret: 'sec',
        refreshToken: 'ref',
      }),
    ).rejects.toBeInstanceOf(SourceError);
  });
});

describe('fetchRecentTracks', () => {
  it('refreshes the access token and reads recently played with it', async () => {
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      if (String(url).includes('/api/token')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'access-1' }) };
      }
      return { ok: true, status: 200, json: async () => fixture };
    });

    const tracks = await fetchRecentTracks({
      fetch: fetchImpl as unknown as typeof fetch,
      clientId: 'cid',
      clientSecret: 'sec',
      refreshToken: 'ref',
      now: NOW,
    });

    expect(tracks[0]?.title).toBe('Same Song');
    const played = fetchImpl.mock.calls.find((call) => String(call[0]).includes('recently-played'));
    expect(String(played?.[0])).toBe('https://api.spotify.com/v1/me/player/recently-played?limit=50');
    expect(new Headers(played?.[1]?.headers).get('authorization')).toBe('Bearer access-1');
  });
});
