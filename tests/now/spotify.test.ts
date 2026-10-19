import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { SourceError } from '../../src/lib/now/http';
import {
  fetchRecentTracks,
  fetchTopArtists,
  parseRecentTracks,
  parseTopArtists,
  refreshAccessToken,
} from '../../src/lib/now/spotify';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/spotify-recently-played.json', import.meta.url), 'utf8'));

describe('parseRecentTracks', () => {
  it('dedupes by track id, keeps the latest play, and caps at five', () => {
    const tracks = parseRecentTracks(fixture);
    expect(tracks.map(track => track.title)).toEqual(['Same Song', 'Two', 'Three', 'Four', 'Five']);
    expect(tracks[0]).toEqual({
      title: 'Same Song',
      artists: 'Artist A, Artist B',
      url: 'https://open.spotify.com/track/t1',
      playedAt: '2026-10-11T18:00:00Z',
      album: 'Album One',
      year: '1999',
      cover: '/api/now/cover/spotify/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(JSON.stringify(tracks)).not.toContain('i.scdn.co');
  });

  it('uses a year-only release date and omits the cover when there is no image', () => {
    const item = structuredClone(fixture.items[3]);
    item.track.album = { name: 'Bare', release_date: '1999', images: [] };
    const tracks = parseRecentTracks({ items: [item] });
    expect(tracks[0]).toMatchObject({ album: 'Bare', year: '1999' });
    expect(tracks[0]?.cover).toBeUndefined();
  });

  it('falls back to the smallest image at least 64 px wide', () => {
    const item = structuredClone(fixture.items[0]);
    item.track.id = 'wide';
    item.track.album.images = [
      { url: `https://i.scdn.co/image/${'d'.repeat(40)}`, width: 640, height: 640 },
      { url: `https://i.scdn.co/image/${'e'.repeat(40)}`, width: 64, height: 64 },
    ];
    const tracks = parseRecentTracks({ items: [item] });
    expect(tracks[0]?.cover).toBe(`/api/now/cover/spotify/${'e'.repeat(40)}`);
  });

  it('drops a track that has no album name and keeps the others', () => {
    const broken = structuredClone(fixture.items[0]);
    broken.track.id = 'no-album';
    delete broken.track.album;
    const tracks = parseRecentTracks({ items: [broken, fixture.items[3]] });
    expect(tracks.map(track => track.title)).toEqual(['Two']);
  });

  it('drops a null track without failing the parse', () => {
    const tracks = parseRecentTracks({
      items: [{ played_at: '2026-10-11T18:00:00Z', track: null }, fixture.items[3]],
    });
    expect(tracks.map(track => track.title)).toEqual(['Two']);
  });

  it('drops a track whose url is outside https://open.spotify.com and keeps the others', () => {
    const evil = structuredClone(fixture.items[0]);
    evil.track.id = 'evil';
    evil.track.name = 'Evil';
    evil.track.external_urls.spotify = 'javascript:alert(1)';

    const tracks = parseRecentTracks({ items: [evil, fixture.items[3]] });
    expect(tracks.map(track => track.title)).toEqual(['Two']);
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

const artistImage = (width: number, hex: string) => ({
  url: `https://i.scdn.co/image/${hex}`,
  width,
  height: width,
});

const topArtists = {
  items: [
    'Raul',
    'Nando',
    'Tim',
    'Gal',
    'Elis',
    'Evil',
    'Rita',
    'Lia',
    'Cazuza',
    'Djavan',
    'Caetano',
    'Gil',
    'Chico',
    'Milton',
  ].map((name, index) => ({
    name,
    external_urls: {
      spotify: name === 'Evil' ? 'javascript:alert(1)' : `https://open.spotify.com/artist/${name.toLowerCase()}`,
    },
    images: [artistImage(640, `${index}`.repeat(40)), artistImage(320, `${index + 1}`.repeat(40))],
  })),
};

describe('parseTopArtists', () => {
  it('keeps twelve artists and the image closest to 320 px, as a local cover', () => {
    const artists = parseTopArtists(topArtists);
    expect(artists.map(artist => artist.name)).toEqual([
      'Raul',
      'Nando',
      'Tim',
      'Gal',
      'Elis',
      'Rita',
      'Lia',
      'Cazuza',
      'Djavan',
      'Caetano',
      'Gil',
      'Chico',
    ]);
    expect(artists[0]?.cover).toBe(`/api/now/cover/spotify/${'1'.repeat(40)}`);
    expect(JSON.stringify(artists)).not.toContain('i.scdn.co');
  });
});

describe('fetchTopArtists', () => {
  it('refreshes once and asks for the short-term top twelve', async () => {
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      if (String(url).includes('/api/token')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'access-1' }) };
      }
      return { ok: true, status: 200, json: async () => topArtists };
    });

    const artists = await fetchTopArtists({
      fetch: fetchImpl as unknown as typeof fetch,
      clientId: 'cid',
      clientSecret: 'sec',
      refreshToken: 'ref',
    });

    expect(artists).toHaveLength(12);
    const played = fetchImpl.mock.calls.find(call => String(call[0]).includes('/top/artists'));
    expect(String(played?.[0])).toBe('https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=12');
    expect(new Headers(played?.[1]?.headers).get('authorization')).toBe('Bearer access-1');
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
    });

    expect(tracks[0]?.title).toBe('Same Song');
    const played = fetchImpl.mock.calls.find(call => String(call[0]).includes('recently-played'));
    expect(String(played?.[0])).toBe('https://api.spotify.com/v1/me/player/recently-played?limit=50');
    expect(new Headers(played?.[1]?.headers).get('authorization')).toBe('Bearer access-1');
  });
});

describe('fetchRecentTracks previews', () => {
  it('keeps a valid ISRC and adds the local preview when Deezer has the recording', async () => {
    const withIsrc = structuredClone(fixture);
    withIsrc.items[0].track.external_ids = { isrc: 'GBUM70812423' };
    withIsrc.items[1].track.external_ids = { isrc: 'not-an-isrc' };
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      const target = String(url);
      if (target.includes('/api/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'a' }) };
      if (target.startsWith('https://api.deezer.com/')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ preview: 'https://cdnt-preview.dzcdn.net/api/1/1/a.mp3?hdnea=x' }),
        };
      }
      return { ok: true, status: 200, json: async () => withIsrc };
    });

    const tracks = await fetchRecentTracks({
      fetch: fetchImpl as unknown as typeof fetch,
      clientId: 'cid',
      clientSecret: 'sec',
      refreshToken: 'ref',
      previews: new Map(),
    });

    const first = tracks.find(track => track.isrc === 'GBUM70812423');
    expect(first?.preview).toBe('/api/now/preview/GBUM70812423');
    expect(tracks.filter(track => track.preview !== undefined)).toHaveLength(1);
    expect(tracks.some(track => track.isrc === 'not-an-isrc')).toBe(false);
  });
});

describe('fetchTopArtists previews', () => {
  it("gives each artist a preview of the author's own top track by them", async () => {
    const PREVIEW = 'https://cdnt-preview.dzcdn.net/api/1/1/x.mp3?hdnea=y';
    const artists = {
      items: [
        {
          id: 'racionais',
          name: "Racionais MC's",
          external_urls: { spotify: 'https://open.spotify.com/artist/racionais' },
          images: [],
        },
      ],
    };
    const myTop = (range: string) => ({
      items:
        range === 'short_term'
          ? [{ name: 'Vida Loka, Pt. 1', artists: [{ id: 'racionais' }], external_ids: { isrc: 'US7VG1324975' } }]
          : [],
    });
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      const target = String(url);
      const body = target.includes('/api/token')
        ? { access_token: 'a' }
        : target.includes('/me/top/artists')
          ? artists
          : target.includes('/me/top/tracks')
            ? myTop(new URL(target).searchParams.get('time_range') ?? '')
            : target.includes('track/isrc:US7VG1324975')
              ? { preview: PREVIEW }
              : { error: { code: 800 } };
      return { ok: true, status: 200, json: async () => body };
    });

    const [racionais] = await fetchTopArtists({
      fetch: fetchImpl as unknown as typeof fetch,
      clientId: 'cid',
      clientSecret: 'sec',
      refreshToken: 'ref',
      previews: new Map(),
    });

    expect(racionais?.preview).toBe('/api/now/preview/US7VG1324975');
    expect(racionais?.previewTitle).toBe('Vida Loka, Pt. 1');
    const ranges = fetchImpl.mock.calls
      .map(([url]) => String(url))
      .filter(url => url.includes('/me/top/tracks'))
      .map(url => new URL(url).searchParams.get('time_range'));
    expect(ranges.sort()).toEqual(['medium_term', 'short_term']);
  });

  it('keeps the artists when the top tracks call fails', async () => {
    const fetchImpl = vi.fn(async (url: string, _init?: RequestInit) => {
      const target = String(url);
      if (target.includes('/api/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'a' }) };
      if (target.includes('/me/top/artists')) return { ok: true, status: 200, json: async () => topArtists };
      return { ok: false, status: 500, json: async () => ({}) };
    });
    const result = await fetchTopArtists({
      fetch: fetchImpl as unknown as typeof fetch,
      clientId: 'cid',
      clientSecret: 'sec',
      refreshToken: 'ref',
      previews: new Map(),
    });
    expect(result).toHaveLength(12);
    expect(result.every(artist => artist.preview === undefined)).toBe(true);
  });
});
