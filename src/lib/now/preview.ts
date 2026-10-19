import { z } from 'zod';
import { mediaType, notFound, readAtMost } from './cover-response';
import { fetchJson } from './http';

/**
 * 30-second previews for the tracks on /now. Spotify no longer sends
 * `preview_url` to new apps, so the exact recording is found on Deezer by its
 * ISRC. The audio is served from this site, like the covers: the visitor never
 * talks to Deezer, and the signed Deezer URL, which expires, never reaches a page.
 */
const ISRC = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
const PREVIEW_HOST = /^[a-z0-9-]+\.dzcdn\.net$/;
const MAX_PREVIEW_BYTES = 1_048_576;

export const previewPath = (isrc: string | undefined): string | undefined =>
  isrc && ISRC.test(isrc) ? `/api/now/preview/${isrc}` : undefined;

const deezerTrackSchema = z.object({ preview: z.string().optional() });

const isDeezerPreview = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && PREVIEW_HOST.test(parsed.hostname);
  } catch {
    return false;
  }
};

/** Signed preview URL of the recording, or nothing. Throws only when Deezer is unreachable. */
export const deezerPreviewUrl = async (fetchImpl: typeof fetch, isrc: string): Promise<string | undefined> => {
  if (!ISRC.test(isrc)) return undefined;
  const parsed = deezerTrackSchema.safeParse(await fetchJson(fetchImpl, `https://api.deezer.com/track/isrc:${isrc}`));
  const preview = parsed.success ? parsed.data.preview : undefined;
  return preview && isDeezerPreview(preview) ? preview : undefined;
};

/** ISRC -> whether Deezer has a preview. Whether a recording has one does not change. */
export type PreviewCache = Map<string, boolean>;

const previewCache: PreviewCache = new Map();

/** Adds `preview` to the tracks Deezer can play, looking each ISRC up once, in parallel. */
export const attachPreviews = async <T extends { isrc?: string }>(
  fetchImpl: typeof fetch,
  tracks: readonly T[],
  cache: PreviewCache = previewCache,
): Promise<Array<T & { preview?: string }>> => {
  const isrcs = [...new Set(tracks.flatMap(track => (previewPath(track.isrc) ? [track.isrc!] : [])))];
  await Promise.all(
    isrcs
      .filter(isrc => !cache.has(isrc))
      .map(async isrc => {
        try {
          cache.set(isrc, (await deezerPreviewUrl(fetchImpl, isrc)) !== undefined);
        } catch {
          // Not cached: the next refresh asks again.
        }
      }),
  );
  return tracks.map(track => {
    const path = previewPath(track.isrc);
    return path && cache.get(track.isrc!) ? { ...track, preview: path } : { ...track };
  });
};

const OWN_TRACKS_TO_TRY = 5;

const deezerArtistSchema = z.object({ data: z.array(z.object({ id: z.number(), name: z.string() })).default([]) });
const deezerTopSchema = z.object({
  data: z.array(z.object({ id: z.number(), title: z.string(), preview: z.string().optional() })).default([]),
});
const deezerIsrcSchema = z.object({ isrc: z.string().optional() });

const sameName = (a: string, b: string): boolean =>
  a.normalize('NFC').trim().toLocaleLowerCase('pt-BR') === b.normalize('NFC').trim().toLocaleLowerCase('pt-BR');

/** The artist's most played track on Deezer, only when Deezer's artist has exactly this name. */
const deezerArtistTop = async (
  fetchImpl: typeof fetch,
  name: string,
): Promise<{ preview: string; previewTitle: string } | undefined> => {
  const search = deezerArtistSchema.safeParse(
    await fetchJson(fetchImpl, `https://api.deezer.com/search/artist?limit=1&q=${encodeURIComponent(name)}`),
  );
  const artist = search.success ? search.data.data[0] : undefined;
  // A search by name can land on a namesake ("Queen" gave another act); only an exact name counts.
  if (!artist || !sameName(artist.name, name)) return undefined;

  const top = deezerTopSchema.safeParse(
    await fetchJson(fetchImpl, `https://api.deezer.com/artist/${artist.id}/top?limit=5`),
  );
  const track = top.success ? top.data.data.find(item => item.preview && isDeezerPreview(item.preview)) : undefined;
  if (!track) return undefined;

  // The preview route is keyed by ISRC, which the top list does not carry.
  const detail = deezerIsrcSchema.safeParse(await fetchJson(fetchImpl, `https://api.deezer.com/track/${track.id}`));
  const preview = previewPath(detail.success ? detail.data.isrc?.toUpperCase() : undefined);
  return preview ? { preview, previewTitle: track.title } : undefined;
};

/**
 * One preview per artist of the month: the author's own most played track by
 * that artist that Deezer can play (up to five tried, in parallel), else the
 * artist's top track on Deezer. Never throws; no preview means no button.
 */
export const pickArtistPreview = async (
  fetchImpl: typeof fetch,
  { name, tracks }: { name: string; tracks: readonly { title: string; isrc?: string }[] },
  cache: PreviewCache = previewCache,
): Promise<{ preview: string; previewTitle: string } | undefined> => {
  try {
    const own = await attachPreviews(
      fetchImpl,
      tracks.filter(track => previewPath(track.isrc)).slice(0, OWN_TRACKS_TO_TRY),
      cache,
    );
    const hit = own.find(track => track.preview);
    if (hit?.preview) return { preview: hit.preview, previewTitle: hit.title };
    return await deezerArtistTop(fetchImpl, name);
  } catch {
    return undefined;
  }
};

export const servePreview = async ({
  isrc,
  fetch: fetchImpl,
}: {
  isrc: string;
  fetch: typeof fetch;
}): Promise<Response> => {
  if (!ISRC.test(isrc)) return notFound();
  try {
    // Looked up on every request: the signed URL expires. Deezer forbids storing
    // audio, so no shared cache keeps it; only the listener's browser does.
    const upstream = await deezerPreviewUrl(fetchImpl, isrc);
    if (!upstream) return notFound();

    const origin = await fetchImpl(upstream, { redirect: 'error', signal: AbortSignal.timeout(5000) });
    if (origin.status !== 200 || mediaType(origin.headers.get('content-type')) !== 'audio/mpeg') return notFound();

    const declared = Number(origin.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_PREVIEW_BYTES) return notFound();

    const body = await readAtMost(origin, MAX_PREVIEW_BYTES);
    if (!body) return notFound();

    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'audio/mpeg',
        'cache-control': 'private, max-age=3600',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return notFound();
  }
};
