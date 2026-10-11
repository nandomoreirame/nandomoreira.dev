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

const titleSchema = z.object({
  name: z.string(),
  type: z.string(),
  titleHistory: z.object({ lastTimePlayed: z.string() }),
});

const historySchema = z.object({
  content: z.object({
    titles: z.array(z.unknown()),
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

/** Games that survived the schema, the date check and the exclusion list, newest first. */
const acceptedGames = (
  json: unknown,
  { exclude = NOW_GAME_EXCLUDE }: { exclude?: readonly string[] } = {},
): RecentGame[] => {
  const parsed = historySchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const excluded = new Set(exclude.map((name) => name.toLowerCase()));
  return parsed.data.content.titles
    .flatMap((item) => {
      const title = titleSchema.safeParse(item);
      if (!title.success) return [];
      if (title.data.type !== 'Game' || excluded.has(title.data.name.toLowerCase())) return [];
      const lastPlayed = playedOn(title.data.titleHistory.lastTimePlayed);
      if (!lastPlayed) return [];
      return [{ name: title.data.name, lastPlayed, at: Date.parse(title.data.titleHistory.lastTimePlayed) }];
    })
    .sort((a, b) => b.at - a.at)
    .map(({ name, lastPlayed }) => ({ name, lastPlayed }));
};

/** Games only, exclusions applied before the cap so the next title fills the slot. */
export const parseRecentGames = (
  json: unknown,
  { limit = 5, exclude = NOW_GAME_EXCLUDE }: { limit?: number; exclude?: readonly string[] } = {},
): RecentGame[] => acceptedGames(json, { exclude }).slice(0, limit);

export const fetchXbox = async ({
  fetch: fetchImpl,
  apiKey,
}: {
  fetch: typeof fetch;
  apiKey: string;
}): Promise<{ playingNow?: PlayingNow; recent: RecentGame[] }> => {
  // Without an explicit locale Node's fetch sends `Accept-Language: *`, which
  // titleHistory rejects with a 200 whose `content` is an error string.
  const headers = { accept: 'application/json', 'accept-language': 'pt-BR', 'X-Authorization': apiKey };
  const [presence, history] = await Promise.all([
    fetchJson(fetchImpl, PRESENCE_URL, { headers }),
    fetchJson(fetchImpl, HISTORY_URL, { headers }),
  ]);
  const eligible = acceptedGames(history);
  const playingNow = parsePresence(presence, eligible);
  return {
    ...(playingNow ? { playingNow } : {}),
    recent: eligible.slice(0, 5),
  };
};
