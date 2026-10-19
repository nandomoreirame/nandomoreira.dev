import { describe, expect, it, vi } from 'vitest';
import {
  attachPreviews,
  deezerPreviewUrl,
  pickArtistPreview,
  previewPath,
  servePreview,
} from '../../src/lib/now/preview';

const ISRC = 'GBUM70812423';
const SIGNED = 'https://cdnt-preview.dzcdn.net/api/1/1/a/b/c/0/abc.mp3?hdnea=exp=1~acl=x~hmac=y';

type Answer = {
  status?: number;
  json?: unknown;
  body?: Uint8Array<ArrayBuffer>;
  type?: string;
  headers?: Record<string, string>;
};

const fakeFetch = (deezer: Answer, audio: Answer = { body: new Uint8Array(10), type: 'audio/mpeg' }) =>
  vi.fn(async (url: string, _init?: RequestInit) => {
    const target = String(url);
    const answer = target.startsWith('https://api.deezer.com/') ? deezer : audio;
    if (answer.json !== undefined) {
      return new Response(JSON.stringify(answer.json), {
        status: answer.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    return new Response(answer.body ?? null, {
      status: answer.status ?? 200,
      headers: { 'content-type': answer.type ?? 'audio/mpeg', ...answer.headers },
    });
  });

describe('previewPath', () => {
  it('maps a valid ISRC to the local route', () => {
    expect(previewPath(ISRC)).toBe(`/api/now/preview/${ISRC}`);
  });

  it('refuses anything that is not an ISRC', () => {
    for (const value of [undefined, '', 'gbum70812423', 'GBUM7081242', '../../etc/passwd', `${ISRC}x`]) {
      expect(previewPath(value), String(value)).toBeUndefined();
    }
  });
});

describe('deezerPreviewUrl', () => {
  it('reads the preview of the exact recording by ISRC', async () => {
    const fetchImpl = fakeFetch({ json: { id: 1, preview: SIGNED } });
    expect(await deezerPreviewUrl(fetchImpl as unknown as typeof fetch, ISRC)).toBe(SIGNED);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`https://api.deezer.com/track/isrc:${ISRC}`);
  });

  it('gives nothing for an unknown recording, which Deezer answers with 200 and an error', async () => {
    const fetchImpl = fakeFetch({ json: { error: { type: 'DataException', code: 800 } } });
    expect(await deezerPreviewUrl(fetchImpl as unknown as typeof fetch, ISRC)).toBeUndefined();
  });

  it('gives nothing for a preview outside the Deezer CDN or over http', async () => {
    for (const preview of ['https://evil.example/a.mp3', 'http://cdnt-preview.dzcdn.net/a.mp3', '']) {
      const fetchImpl = fakeFetch({ json: { preview } });
      expect(await deezerPreviewUrl(fetchImpl as unknown as typeof fetch, ISRC), preview).toBeUndefined();
    }
  });
});

describe('attachPreviews', () => {
  const tracks = [{ title: 'A', isrc: ISRC }, { title: 'B', isrc: 'USDJ20201135' }, { title: 'C' }];

  it('adds the local preview path only to tracks Deezer can play', async () => {
    const fetchImpl = vi.fn(
      async (url: string) =>
        new Response(JSON.stringify(String(url).endsWith(ISRC) ? { preview: SIGNED } : { error: { code: 800 } }), {
          headers: { 'content-type': 'application/json' },
        }),
    );

    const result = await attachPreviews(fetchImpl as unknown as typeof fetch, tracks, new Map());

    expect(result.map(track => track.preview)).toEqual([`/api/now/preview/${ISRC}`, undefined, undefined]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('asks Deezer once per ISRC and does not cache a failure', async () => {
    const cache = new Map<string, boolean>();
    const ok = vi.fn(async () => new Response(JSON.stringify({ preview: SIGNED })));
    await attachPreviews(ok as unknown as typeof fetch, tracks, cache);
    await attachPreviews(ok as unknown as typeof fetch, tracks, cache);
    expect(ok).toHaveBeenCalledTimes(2);

    const failing = new Map<string, boolean>();
    const down = vi.fn(async () => {
      throw new Error('down');
    });
    const result = await attachPreviews(down as unknown as typeof fetch, tracks, failing);
    expect(result.every(track => track.preview === undefined)).toBe(true);
    expect(failing.size).toBe(0);
  });
});

describe('servePreview', () => {
  // Deezer forbids storing audio, so no shared cache keeps it: only the listener's browser.
  it('streams the preview audio, cacheable only by the browser, with nosniff', async () => {
    const fetchImpl = fakeFetch({ json: { preview: SIGNED } }, { body: new Uint8Array(400), type: 'audio/mpeg' });
    const response = await servePreview({ isrc: ISRC, fetch: fetchImpl as unknown as typeof fetch });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('audio/mpeg');
    expect(response.headers.get('cache-control')).toBe('private, max-age=3600');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect((await response.arrayBuffer()).byteLength).toBe(400);
    expect(fetchImpl.mock.calls[1]?.[1]?.redirect).toBe('error');
  });

  it('answers 404 without calling anyone for an invalid ISRC', async () => {
    const fetchImpl = fakeFetch({ json: { preview: SIGNED } });
    const response = await servePreview({ isrc: '../x', fetch: fetchImpl as unknown as typeof fetch });
    expect(response.status).toBe(404);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('answers 404 when Deezer has no preview, the audio is not mp3, or it is too large', async () => {
    const cases = [
      fakeFetch({ json: { error: { code: 800 } } }),
      fakeFetch({ json: { preview: SIGNED } }, { body: new Uint8Array(10), type: 'text/html' }),
      fakeFetch({ json: { preview: SIGNED } }, { body: new Uint8Array(1_100_000), type: 'audio/mpeg' }),
      fakeFetch({ json: { preview: SIGNED } }, { status: 403 }),
    ];
    for (const fetchImpl of cases) {
      const response = await servePreview({ isrc: ISRC, fetch: fetchImpl as unknown as typeof fetch });
      expect(response.status).toBe(404);
    }
  });

  it('never forwards a cookie from the origin', async () => {
    const fetchImpl = fakeFetch(
      { json: { preview: SIGNED } },
      { body: new Uint8Array(10), type: 'audio/mpeg', headers: { 'set-cookie': 'track=1' } },
    );
    const response = await servePreview({ isrc: ISRC, fetch: fetchImpl as unknown as typeof fetch });
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});

describe('pickArtistPreview', () => {
  const PREVIEW = 'https://cdnt-preview.dzcdn.net/api/1/1/x.mp3?hdnea=y';
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

  // Deezer double: ISRC lookups answer from `byIsrc`; the artist search and top answer from `catalog`.
  const deezer = (
    byIsrc: Record<string, boolean>,
    catalog: { artist?: string; top?: unknown[]; track?: unknown } = {},
  ) =>
    vi.fn(async (url: string) => {
      const target = String(url);
      const isrc = target.match(/track\/isrc:([A-Z0-9]+)$/)?.[1];
      if (isrc) return json(byIsrc[isrc] ? { preview: PREVIEW } : { error: { code: 800 } });
      if (target.includes('/search/artist'))
        return json({ data: catalog.artist ? [{ id: 7, name: catalog.artist }] : [] });
      if (target.includes('/artist/7/top')) return json({ data: catalog.top ?? [] });
      if (target.includes('/track/99')) return json(catalog.track ?? {});
      throw new Error(`unexpected ${target}`);
    });

  it('prefers the most played own track that Deezer can play', async () => {
    const fetchImpl = deezer({ USUM72004303: false, US7VG1324975: true });
    const pick = await pickArtistPreview(
      fetchImpl as unknown as typeof fetch,
      {
        name: "Racionais MC's",
        tracks: [
          { title: 'Sem prévia', isrc: 'USUM72004303' },
          { title: 'Vida Loka, Pt. 1', isrc: 'US7VG1324975' },
        ],
      },
      new Map(),
    );
    expect(pick).toEqual({ preview: '/api/now/preview/US7VG1324975', previewTitle: 'Vida Loka, Pt. 1' });
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('/search/'))).toBe(false);
  });

  it('falls back to the artist top on Deezer when the name matches exactly', async () => {
    const fetchImpl = deezer(
      { BRWMB0101850: true },
      {
        artist: 'Raul Seixas',
        top: [{ id: 99, title: 'Metamorfose Ambulante', preview: PREVIEW }],
        track: { isrc: 'BRWMB0101850' },
      },
    );
    const pick = await pickArtistPreview(
      fetchImpl as unknown as typeof fetch,
      { name: 'Raul Seixas', tracks: [] },
      new Map(),
    );
    expect(pick).toEqual({ preview: '/api/now/preview/BRWMB0101850', previewTitle: 'Metamorfose Ambulante' });
  });

  it('refuses a namesake: a different name on Deezer gives no preview', async () => {
    const fetchImpl = deezer({}, { artist: 'Queen Naija', top: [{ id: 99, title: '#War', preview: PREVIEW }] });
    const pick = await pickArtistPreview(
      fetchImpl as unknown as typeof fetch,
      { name: 'Queen', tracks: [] },
      new Map(),
    );
    expect(pick).toBeUndefined();
  });

  it('looks at no more than five own tracks, then falls back', async () => {
    const own = Array.from({ length: 8 }, (_, index) => ({
      title: `T${index}`,
      isrc: `BRWMB01018${String(index).padStart(2, '0')}`,
    }));
    const fetchImpl = deezer({ BRWMB0101807: true }, { artist: 'Barão Vermelho', top: [] });
    const pick = await pickArtistPreview(
      fetchImpl as unknown as typeof fetch,
      { name: 'Barão Vermelho', tracks: own },
      new Map(),
    );
    expect(pick).toBeUndefined();
    const isrcCalls = fetchImpl.mock.calls.filter(([url]) => String(url).includes('track/isrc:'));
    expect(isrcCalls).toHaveLength(5);
  });

  it('gives nothing, without throwing, when Deezer is down', async () => {
    const down = vi.fn(async () => {
      throw new Error('down');
    });
    const pick = await pickArtistPreview(
      down as unknown as typeof fetch,
      { name: 'Queen', tracks: [{ title: "Don't Stop Me Now", isrc: 'GBUM71029610' }] },
      new Map(),
    );
    expect(pick).toBeUndefined();
  });
});
