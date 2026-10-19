import { z } from 'zod';
import { coverPathFromUpstream } from './cover';
import { SourceError, fetchJson } from './http';
import { attachPreviews, pickArtistPreview, previewPath, type PreviewCache } from './preview';
import { isAllowedUrl } from './safe';

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const RECENT_URL = 'https://api.spotify.com/v1/me/player/recently-played?limit=50';

const imageSchema = z.object({
  url: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

const albumSchema = z.object({
  name: z.string().min(1),
  release_date: z.string().optional(),
  images: z.array(imageSchema).default([]),
});

const trackSchema = z.object({
  id: z.string(),
  name: z.string(),
  artists: z.array(z.object({ name: z.string() })),
  album: albumSchema,
  external_ids: z.object({ isrc: z.string().optional() }).optional(),
  external_urls: z.object({
    spotify: z
      .string()
      .refine(url => isAllowedUrl(url, 'open.spotify.com') && url.startsWith('https://open.spotify.com/')),
  }),
});

const playedItemSchema = z.object({
  played_at: z.string(),
  track: trackSchema.nullable(),
});

const recentSchema = z.object({
  items: z.array(z.unknown()),
});

const tokenSchema = z.object({ access_token: z.string().min(1) });

export interface RecentTrack {
  title: string;
  artists: string;
  album: string;
  year?: string;
  cover?: string;
  url: string;
  playedAt: string;
  /** Recording code, kept only when valid: the key for the Deezer preview. */
  isrc?: string;
  /** Local preview route, only when Deezer has the recording. */
  preview?: string;
}

/** 300 px when present, otherwise the smallest image that is still sharp enough. */
const coverFromImages = (images: readonly { url: string; width: number | null }[]): string | undefined => {
  const usable = images.flatMap(image => {
    if (image.width === null || image.width < 64) return [];
    const path = coverPathFromUpstream(image.url);
    return path ? [{ width: image.width, path }] : [];
  });
  const exact = usable.find(image => image.width === 300);
  if (exact) return exact.path;
  return usable.sort((a, b) => a.width - b.width)[0]?.path;
};

const yearOf = (releaseDate: string | undefined): string | undefined => {
  const year = releaseDate?.slice(0, 4);
  return year !== undefined && /^\d{4}$/.test(year) ? year : undefined;
};

export const parseRecentTracks = (json: unknown, { limit = 5 }: { limit?: number } = {}): RecentTrack[] => {
  const parsed = recentSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const seen = new Set<string>();
  return parsed.data.items
    .flatMap(item => {
      const parsedItem = playedItemSchema.safeParse(item);
      if (!parsedItem.success || !parsedItem.data.track) return [];
      return [{ playedAt: parsedItem.data.played_at, track: parsedItem.data.track }];
    })
    .sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt))
    .filter(item => {
      if (seen.has(item.track.id)) return false;
      seen.add(item.track.id);
      return true;
    })
    .slice(0, limit)
    .map(item => {
      const year = yearOf(item.track.album.release_date);
      const cover = coverFromImages(item.track.album.images);
      const isrc = item.track.external_ids?.isrc?.toUpperCase();
      return {
        title: item.track.name,
        artists: item.track.artists.map(artist => artist.name).join(', '),
        album: item.track.album.name,
        ...(year ? { year } : {}),
        ...(cover ? { cover } : {}),
        url: item.track.external_urls.spotify,
        playedAt: item.playedAt,
        ...(previewPath(isrc) ? { isrc } : {}),
      };
    });
};

export const refreshAccessToken = async ({
  fetch: fetchImpl,
  clientId,
  clientSecret,
  refreshToken,
}: {
  fetch: typeof fetch;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> => {
  const json = await fetchJson(fetchImpl, TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }).toString(),
  });
  const parsed = tokenSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');
  return parsed.data.access_token;
};

export interface TopArtist {
  /** Spotify artist id: matches the author's own tracks to the artist. Not rendered. */
  id?: string;
  name: string;
  url: string;
  cover?: string;
  /** Local preview route of one track by the artist, with its title for the label. */
  preview?: string;
  previewTitle?: string;
}

const artistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  external_urls: z.object({
    spotify: z
      .string()
      .refine(url => isAllowedUrl(url, 'open.spotify.com') && url.startsWith('https://open.spotify.com/')),
  }),
  images: z.array(imageSchema).default([]),
});

const artistsSchema = z.object({
  items: z.array(z.unknown()),
});

/** Valid cover whose width is nearest the target. A tie keeps the smaller image. */
const coverClosestTo = (
  images: readonly { url: string; width: number | null }[],
  target: number,
): string | undefined => {
  const usable = images.flatMap(image => {
    if (image.width === null) return [];
    const path = coverPathFromUpstream(image.url);
    return path ? [{ width: image.width, path }] : [];
  });
  usable.sort((a, b) => Math.abs(a.width - target) - Math.abs(b.width - target) || a.width - b.width);
  return usable[0]?.path;
};

export const parseTopArtists = (json: unknown, { limit = 12 }: { limit?: number } = {}): TopArtist[] => {
  const parsed = artistsSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  return parsed.data.items
    .flatMap(item => {
      const artist = artistSchema.safeParse(item);
      if (!artist.success) return [];
      const cover = coverClosestTo(artist.data.images, 320);
      return [
        {
          ...(artist.data.id ? { id: artist.data.id } : {}),
          name: artist.data.name,
          url: artist.data.external_urls.spotify,
          ...(cover ? { cover } : {}),
        },
      ];
    })
    .slice(0, limit);
};

// Twelve since 2026-10-16: two rows of six from sm, the first six on a phone.
const TOP_URL = 'https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=12';
const TOP_TRACKS_URL = 'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=';

const ownTrackSchema = z.object({
  name: z.string(),
  artists: z.array(z.object({ id: z.string() })),
  external_ids: z.object({ isrc: z.string().optional() }).optional(),
});

interface OwnTrack {
  title: string;
  isrc?: string;
  artistIds: string[];
}

/**
 * The author's most played tracks, last four weeks first, then the last six
 * months: the pool a preview for each artist of the month is drawn from.
 * Best effort: a failure only means falling back to Deezer's own top.
 */
const myTopTracks = async (fetchImpl: typeof fetch, headers: Record<string, string>): Promise<OwnTrack[]> => {
  const ranges = await Promise.all(
    ['short_term', 'medium_term'].map(async range => {
      try {
        const json = await fetchJson(fetchImpl, `${TOP_TRACKS_URL}${range}`, { headers });
        const items = z.object({ items: z.array(z.unknown()) }).safeParse(json);
        return items.success ? items.data.items : [];
      } catch {
        return [];
      }
    }),
  );
  return ranges.flat().flatMap(item => {
    const track = ownTrackSchema.safeParse(item);
    if (!track.success) return [];
    const isrc = track.data.external_ids?.isrc?.toUpperCase();
    return [
      { title: track.data.name, ...(isrc ? { isrc } : {}), artistIds: track.data.artists.map(artist => artist.id) },
    ];
  });
};

export const fetchTopArtists = async ({
  fetch: fetchImpl,
  clientId,
  clientSecret,
  refreshToken,
  previews,
}: {
  fetch: typeof fetch;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  previews?: PreviewCache;
}): Promise<TopArtist[]> => {
  const accessToken = await refreshAccessToken({ fetch: fetchImpl, clientId, clientSecret, refreshToken });
  const headers = { authorization: `Bearer ${accessToken}` };
  const [json, ownTracks] = await Promise.all([
    fetchJson(fetchImpl, TOP_URL, { headers }),
    myTopTracks(fetchImpl, headers),
  ]);
  const artists = parseTopArtists(json);
  return Promise.all(
    artists.map(async artist => {
      const tracks = artist.id ? ownTracks.filter(track => track.artistIds.includes(artist.id!)) : [];
      const pick = await pickArtistPreview(fetchImpl, { name: artist.name, tracks }, previews);
      return pick ? { ...artist, ...pick } : artist;
    }),
  );
};

export const fetchRecentTracks = async ({
  fetch: fetchImpl,
  clientId,
  clientSecret,
  refreshToken,
  previews,
}: {
  fetch: typeof fetch;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  previews?: PreviewCache;
}): Promise<RecentTrack[]> => {
  const accessToken = await refreshAccessToken({ fetch: fetchImpl, clientId, clientSecret, refreshToken });
  const json = await fetchJson(fetchImpl, RECENT_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return attachPreviews(fetchImpl, parseRecentTracks(json), previews);
};
