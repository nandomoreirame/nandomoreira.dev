import { z } from 'zod';
import { saoPauloDay } from './day';
import { SourceError, fetchJson } from './http';
import { NOW_GAME_EXCLUDE } from './now';

const PRESENCE_URL = 'https://api.xbl.io/v2/presence';
const HISTORY_URL = 'https://api.xbl.io/v2/player/titleHistory';

const presenceSchema = z.object({
  content: z.object({
    state: z.string(),
    devices: z
      .array(
        z.object({
          type: z.string(),
          titles: z
            .array(
              z.object({
                name: z.string(),
                placement: z.string(),
                state: z.string().optional(),
              }),
            )
            .default([]),
        }),
      )
      .default([]),
  }),
});

const historySchema = z.object({
  content: z.object({
    titles: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        titleHistory: z.object({ lastTimePlayed: z.string() }),
      }),
    ),
  }),
});

export interface RecentGame {
  name: string;
  lastPlayed: string;
}

export interface PlayingNow {
  title: string;
}

/** Sao Paulo calendar day. An invalid instant is omitted so the list stays dated. */
const playedOn = (iso: string): string | undefined => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return saoPauloDay(date);
};

/**
 * Console title in the foreground, and only when that name survived the
 * history filter. Web, Home and excluded games stay out (REQ-009).
 */
export const parsePresence = (
  json: unknown,
  recentGames: readonly { name: string }[],
): PlayingNow | undefined => {
  const parsed = presenceSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const allowed = new Set(recentGames.map((game) => game.name.toLowerCase()));
  for (const device of parsed.data.content.devices) {
    if (device.type === 'Web') continue;
    for (const title of device.titles) {
      if (title.placement !== 'Full' || title.name.trim().length === 0) continue;
      if (!allowed.has(title.name.toLowerCase())) continue;
      return { title: title.name };
    }
  }
  return undefined;
};

/** Games only, exclusions applied before the cap so the next title fills the slot. */
export const parseRecentGames = (
  json: unknown,
  { limit = 5, exclude = NOW_GAME_EXCLUDE }: { limit?: number; exclude?: readonly string[] } = {},
): RecentGame[] => {
  const parsed = historySchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const excluded = new Set(exclude.map((name) => name.toLowerCase()));
  return parsed.data.content.titles
    .filter((title) => title.type === 'Game' && !excluded.has(title.name.toLowerCase()))
    .sort(
      (a, b) =>
        Date.parse(b.titleHistory.lastTimePlayed) - Date.parse(a.titleHistory.lastTimePlayed),
    )
    .slice(0, limit)
    .flatMap((title) => {
      const lastPlayed = playedOn(title.titleHistory.lastTimePlayed);
      return lastPlayed ? [{ name: title.name, lastPlayed }] : [];
    });
};

export const fetchXbox = async ({
  fetch: fetchImpl,
  apiKey,
}: {
  fetch: typeof fetch;
  apiKey: string;
}): Promise<{ playingNow?: PlayingNow; recent: RecentGame[] }> => {
  const headers = { accept: 'application/json', 'X-Authorization': apiKey };
  const [presence, history] = await Promise.all([
    fetchJson(fetchImpl, PRESENCE_URL, { headers }),
    fetchJson(fetchImpl, HISTORY_URL, { headers }),
  ]);
  const recentGames = parseRecentGames(history, { limit: Number.POSITIVE_INFINITY });
  const playingNow = parsePresence(presence, recentGames);
  return {
    ...(playingNow ? { playingNow } : {}),
    recent: recentGames.slice(0, 5),
  };
};
