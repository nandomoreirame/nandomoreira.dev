import { z } from 'zod';
import { coverPathFromUpstream } from './cover';
import { SourceError, fetchJson } from './http';
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
  external_urls: z.object({
    spotify: z
      .string()
      .refine((url) => isAllowedUrl(url, 'open.spotify.com') && url.startsWith('https://open.spotify.com/')),
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
}

/** 300 px when present, otherwise the smallest image that is still sharp enough. */
const coverFromImages = (images: readonly { url: string; width: number | null }[]): string | undefined => {
  const usable = images.flatMap((image) => {
    if (image.width === null || image.width < 64) return [];
    const path = coverPathFromUpstream(image.url);
    return path ? [{ width: image.width, path }] : [];
  });
  const exact = usable.find((image) => image.width === 300);
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
    .flatMap((item) => {
      const parsedItem = playedItemSchema.safeParse(item);
      if (!parsedItem.success || !parsedItem.data.track) return [];
      return [{ playedAt: parsedItem.data.played_at, track: parsedItem.data.track }];
    })
    .sort((a, b) => Date.parse(b.playedAt) - Date.parse(a.playedAt))
    .filter((item) => {
      if (seen.has(item.track.id)) return false;
      seen.add(item.track.id);
      return true;
    })
    .slice(0, limit)
    .map((item) => {
      const year = yearOf(item.track.album.release_date);
      const cover = coverFromImages(item.track.album.images);
      return {
        title: item.track.name,
        artists: item.track.artists.map((artist) => artist.name).join(', '),
        album: item.track.album.name,
        ...(year ? { year } : {}),
        ...(cover ? { cover } : {}),
        url: item.track.external_urls.spotify,
        playedAt: item.playedAt,
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

export const fetchRecentTracks = async ({
  fetch: fetchImpl,
  clientId,
  clientSecret,
  refreshToken,
}: {
  fetch: typeof fetch;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<RecentTrack[]> => {
  const accessToken = await refreshAccessToken({ fetch: fetchImpl, clientId, clientSecret, refreshToken });
  const json = await fetchJson(fetchImpl, RECENT_URL, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  return parseRecentTracks(json);
};
