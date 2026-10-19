import { z } from 'zod';
import { coverPathFromUpstream } from './cover';
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
  displayImage: z.string().optional(),
  devices: z.array(z.string()).optional(),
  titleId: z.string().optional(),
  achievement: z
    .object({
      currentGamerscore: z.number().optional(),
      totalGamerscore: z.number().optional(),
      progressPercentage: z.number().optional(),
    })
    .optional(),
});

const historySchema = z.object({
  content: z.object({
    titles: z.array(z.unknown()),
  }),
});

export interface GameProgress {
  current: number;
  total: number;
  percent: number;
}

/** Microsoft Store product ids: twelve upper-case letters and digits (9P079R5LGV4T, BPSWGQBW7R3G). */
const STORE_PRODUCT = /^[0-9A-Z]{12}$/;

/** Store page of a game, or nothing: xbox.com search answered 500 when probed, so it is no fallback. */
export const xboxStoreUrl = (productId: string | undefined): string | undefined =>
  productId && STORE_PRODUCT.test(productId) ? `https://www.xbox.com/pt-BR/games/store/-/${productId}` : undefined;

const CATALOG_URL = 'https://displaycatalog.mp.microsoft.com/v7.0/products/lookup';

const catalogSchema = z.object({
  Products: z.array(z.object({ ProductId: z.string() })).default([]),
});

/** titleId -> store product id; null means the catalog answered and had none. */
export type ProductIdCache = Map<string, string | null>;

// A title's product id never changes, so the cache lives for the instance.
const productIdCache: ProductIdCache = new Map();

/**
 * Title history carries no store id; the public Microsoft catalog maps the
 * Xbox title id to one. A failed lookup is not cached, so it retries later.
 */
const lookupProductId = async (
  fetchImpl: typeof fetch,
  titleId: string,
  cache: ProductIdCache,
): Promise<string | undefined> => {
  if (cache.has(titleId)) return cache.get(titleId) ?? undefined;
  if (!/^\d+$/.test(titleId)) return undefined;
  try {
    const query = new URLSearchParams({
      alternateId: 'XboxTitleId',
      value: titleId,
      market: 'BR',
      languages: 'pt-BR',
      fieldsTemplate: 'browse',
    });
    const parsed = catalogSchema.safeParse(await fetchJson(fetchImpl, `${CATALOG_URL}?${query}`));
    if (!parsed.success) return undefined;
    const productId = parsed.data.Products.map(product => product.ProductId).find(id => STORE_PRODUCT.test(id));
    cache.set(titleId, productId ?? null);
    return productId;
  } catch {
    return undefined;
  }
};

export interface RecentGame {
  name: string;
  /** Store page, only when the catalog knows the game. */
  url?: string;
  lastPlayed: string;
  platforms: string[];
  cover?: string;
  progress?: GameProgress;
}

export interface PlayingNow {
  title: string;
  url?: string;
  platforms: string[];
  cover?: string;
  progress?: GameProgress;
}

const PLATFORM_LABEL: Record<string, string> = {
  XboxOne: 'Xbox One',
  XboxSeries: 'Xbox Series',
  PC: 'PC',
  Xbox360: 'Xbox 360',
};

const platformsOf = (devices: readonly string[] | undefined): string[] => {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const device of devices ?? []) {
    const label = PLATFORM_LABEL[device];
    if (!label || seen.has(label)) continue;
    seen.add(label);
    labels.push(label);
  }
  return labels;
};

const progressOf = (
  achievement: { currentGamerscore?: number; totalGamerscore?: number; progressPercentage?: number } | undefined,
): GameProgress | undefined => {
  const total = achievement?.totalGamerscore;
  if (total === undefined || total <= 0) return undefined;
  const raw = achievement?.progressPercentage ?? 0;
  return {
    current: achievement?.currentGamerscore ?? 0,
    total,
    percent: Math.round(Math.min(100, Math.max(0, raw))),
  };
};

const mediaOf = (title: z.infer<typeof titleSchema>): Pick<RecentGame, 'platforms' | 'cover' | 'progress'> => {
  const cover = title.displayImage ? coverPathFromUpstream(title.displayImage) : undefined;
  const progress = progressOf(title.achievement);
  return {
    platforms: platformsOf(title.devices),
    ...(cover ? { cover } : {}),
    ...(progress ? { progress } : {}),
  };
};

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
export const parsePresence = (json: unknown, recentGames: readonly RecentGame[]): PlayingNow | undefined => {
  const parsed = presenceSchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  for (const device of parsed.data.content.devices) {
    if (device.type === 'Web') continue;
    for (const title of device.titles) {
      if (title.placement !== 'Full' || title.name.trim().length === 0) continue;
      const match = recentGames.find(game => game.name.toLowerCase() === title.name.toLowerCase());
      if (!match) continue;
      return {
        title: title.name,
        ...(match.url ? { url: match.url } : {}),
        platforms: match.platforms,
        ...(match.cover ? { cover: match.cover } : {}),
        ...(match.progress ? { progress: match.progress } : {}),
      };
    }
  }
  return undefined;
};

/** A history game plus the Xbox title id the catalog lookup needs. */
type HistoryGame = RecentGame & { titleId?: string };

const publicGame = ({ titleId: _titleId, ...game }: HistoryGame): RecentGame => game;

/** Games that survived the schema, the date check and the exclusion list, newest first. */
const acceptedGames = (
  json: unknown,
  { exclude = NOW_GAME_EXCLUDE }: { exclude?: readonly string[] } = {},
): HistoryGame[] => {
  const parsed = historySchema.safeParse(json);
  if (!parsed.success) throw new SourceError('shape');

  const excluded = new Set(exclude.map(name => name.toLowerCase()));
  return parsed.data.content.titles
    .flatMap(item => {
      const title = titleSchema.safeParse(item);
      if (!title.success) return [];
      if (title.data.type !== 'Game' || excluded.has(title.data.name.toLowerCase())) return [];
      const lastPlayed = playedOn(title.data.titleHistory.lastTimePlayed);
      if (!lastPlayed) return [];
      return [
        {
          name: title.data.name,
          lastPlayed,
          at: Date.parse(title.data.titleHistory.lastTimePlayed),
          titleId: title.data.titleId,
          ...mediaOf(title.data),
        },
      ];
    })
    .sort((a, b) => b.at - a.at)
    .map(({ name, lastPlayed, titleId, platforms, cover, progress }) => ({
      name,
      lastPlayed,
      platforms,
      ...(titleId ? { titleId } : {}),
      ...(cover ? { cover } : {}),
      ...(progress ? { progress } : {}),
    }));
};

/** Games only, exclusions applied before the cap so the next title fills the slot. */
export const parseRecentGames = (
  json: unknown,
  { limit = 5, exclude = NOW_GAME_EXCLUDE }: { limit?: number; exclude?: readonly string[] } = {},
): RecentGame[] => acceptedGames(json, { exclude }).slice(0, limit).map(publicGame);

export const fetchXbox = async ({
  fetch: fetchImpl,
  apiKey,
  productIds = productIdCache,
}: {
  fetch: typeof fetch;
  apiKey: string;
  productIds?: ProductIdCache;
}): Promise<{ playingNow?: PlayingNow; recent: RecentGame[] }> => {
  // Without an explicit locale Node's fetch sends `Accept-Language: *`, which
  // titleHistory rejects with a 200 whose `content` is an error string.
  const headers = { accept: 'application/json', 'accept-language': 'pt-BR', 'X-Authorization': apiKey };
  const [presence, history] = await Promise.all([
    fetchJson(fetchImpl, PRESENCE_URL, { headers }),
    fetchJson(fetchImpl, HISTORY_URL, { headers }),
  ]);
  const eligible = acceptedGames(history);
  const shown = eligible.slice(0, 5);
  const playing = parsePresence(presence, eligible);
  const playingGame = playing && eligible.find(game => game.name.toLowerCase() === playing.title.toLowerCase());

  // Only the games on the page are looked up, in parallel; the cache makes
  // later refreshes free.
  const titleIds = [...new Set([...shown, ...(playingGame ? [playingGame] : [])].flatMap(game => game.titleId ?? []))];
  const urls = new Map<string, string>();
  await Promise.all(
    titleIds.map(async titleId => {
      const url = xboxStoreUrl(await lookupProductId(fetchImpl, titleId, productIds));
      if (url) urls.set(titleId, url);
    }),
  );
  const urlOf = (game: HistoryGame | undefined): string | undefined =>
    game?.titleId ? urls.get(game.titleId) : undefined;

  const recent = shown.map(game => {
    const url = urlOf(game);
    return { ...publicGame(game), ...(url ? { url } : {}) };
  });
  const playingUrl = urlOf(playingGame);
  return {
    ...(playing ? { playingNow: { ...playing, ...(playingUrl ? { url: playingUrl } : {}) } } : {}),
    recent,
  };
};
