import { getSecret } from 'astro:env/server';
import { UPCOMING_LIMIT } from '../../components/posts/upcoming-limit';
import { getAvailability, getCurrentPosts, getUpcomingPosts } from '../content';
import type { Post } from '../../content/schemas/post';
import { createCachedSource } from './cache';
import { readNowConfig, type NowConfig } from './config';
import { dayLabel } from './day';
import { fetchActiveRepos, type ActiveRepo } from './github';
import { logSourceError } from './http';
import { NOW_DECLINING, NOW_FAILURE_TTL_MS, NOW_FOCUS, NOW_GAMES, NOW_REPO_EXCLUDE, NOW_STUDYING, NOW_TTL } from './now';
import { fetchRecentTracks, fetchTopArtists, type RecentTrack, type TopArtist } from './spotify';
import { fetchXbox, type PlayingNow, type RecentGame } from './xbox';

export type Section<T> = { state: 'ok'; items: T } | { state: 'fallback'; items: T } | { state: 'empty' };

export interface XboxNow {
  playingNow?: PlayingNow;
  recent: RecentGame[];
}

export type GamesSection =
  | { state: 'ok'; items: XboxNow }
  | { state: 'fallback'; items: readonly { name: string; note?: string }[] }
  | { state: 'empty' };

export type RecentTrackView = RecentTrack & { day: string };

export interface NowMusic {
  recent: Section<RecentTrackView[]>;
  topArtists: Section<TopArtist[]>;
}

export interface NowSnapshot {
  projects: Section<ActiveRepo[]>;
  music: NowMusic;
  games: GamesSection;
  writing: { latest: Post | undefined; drafts: string[] };
  focus: { items: readonly string[]; declining: readonly string[]; availability: string };
  studying: typeof NOW_STUDYING;
}

const arraySection = <T>(items: readonly T[]): Section<T[]> =>
  items.length === 0 ? { state: 'empty' } : { state: 'ok', items: [...items] };

const gamesSection = (
  result: PromiseSettledResult<XboxNow | 'unconfigured'>,
  fallbackGames: readonly { name: string; note?: string }[],
  logger: Pick<Console, 'warn'>,
): GamesSection => {
  const fallback = (): GamesSection =>
    fallbackGames.length === 0 ? { state: 'empty' } : { state: 'fallback', items: fallbackGames };

  if (result.status === 'rejected') {
    logSourceError('xbox', result.reason, logger);
    return fallback();
  }
  if (result.value === 'unconfigured' || (!result.value.playingNow && result.value.recent.length === 0)) {
    return fallback();
  }
  return { state: 'ok', items: result.value };
};

export const createNowLoader = ({
  config,
  fetch: fetchImpl,
  now = Date.now,
  logger = console,
  fallbackGames = NOW_GAMES,
  currentPosts = getCurrentPosts,
}: {
  config: NowConfig;
  fetch: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'warn'>;
  fallbackGames?: readonly { name: string; note?: string }[];
  currentPosts?: () => Promise<Post[]>;
}) => {
  const clock = () => new Date(now());
  const spotifyConfig = config.spotify;
  const xboxConfig = config.xbox;
  const github = createCachedSource({
    ttlMs: NOW_TTL.github,
    failureTtlMs: NOW_FAILURE_TTL_MS,
    now,
    load: () =>
      fetchActiveRepos({
        fetch: fetchImpl,
        token: config.github.token,
        now: clock(),
        exclude: NOW_REPO_EXCLUDE,
      }),
  });
  const spotify = spotifyConfig
    ? createCachedSource({
        ttlMs: NOW_TTL.spotify,
        failureTtlMs: NOW_FAILURE_TTL_MS,
        now,
        load: () => fetchRecentTracks({ fetch: fetchImpl, ...spotifyConfig }),
      })
    : undefined;
  const spotifyTop = spotifyConfig
    ? createCachedSource({
        ttlMs: NOW_TTL.spotifyTop,
        failureTtlMs: NOW_FAILURE_TTL_MS,
        now,
        load: () => fetchTopArtists({ fetch: fetchImpl, ...spotifyConfig }),
      })
    : undefined;
  const xbox = xboxConfig
    ? createCachedSource({
        ttlMs: NOW_TTL.xbox,
        failureTtlMs: NOW_FAILURE_TTL_MS,
        now,
        load: () => fetchXbox({ fetch: fetchImpl, apiKey: xboxConfig.apiKey }),
      })
    : undefined;

  return async (): Promise<NowSnapshot> => {
    const [[projectsResult, musicResult, gamesResult, topResult], posts, drafts, availability] = await Promise.all([
      Promise.allSettled([
        github(),
        spotify ? spotify() : Promise.resolve('unconfigured' as const),
        xbox ? xbox() : Promise.resolve('unconfigured' as const),
        spotifyTop ? spotifyTop() : Promise.resolve('unconfigured' as const),
      ]),
      currentPosts(),
      getUpcomingPosts(),
      getAvailability(),
    ]);

    const projects =
      projectsResult.status === 'rejected'
        ? (logSourceError('github', projectsResult.reason, logger), { state: 'empty' as const })
        : arraySection(projectsResult.value);

    const recent =
      musicResult.status === 'rejected'
        ? (logSourceError('spotify', musicResult.reason, logger), { state: 'empty' as const })
        : musicResult.value === 'unconfigured'
          ? { state: 'empty' as const }
          : arraySection(musicResult.value.map((track) => ({ ...track, day: dayLabel(track.playedAt, clock()) })));

    const topArtists =
      topResult.status === 'rejected'
        ? (logSourceError('spotify-top', topResult.reason, logger), { state: 'empty' as const })
        : topResult.value === 'unconfigured'
          ? { state: 'empty' as const }
          : arraySection(topResult.value);

    const games = gamesSection(gamesResult, fallbackGames, logger);

    return {
      projects,
      music: { recent, topArtists },
      games,
      writing: {
        latest: posts.find((post) => post.draft !== true),
        drafts: drafts.slice(0, UPCOMING_LIMIT).map((post) => post.title),
      },
      focus: {
        items: NOW_FOCUS,
        declining: NOW_DECLINING,
        availability: availability.detail,
      },
      studying: NOW_STUDYING,
    };
  };
};

let cached: ReturnType<typeof createNowLoader> | undefined;

/**
 * `astro dev` does not copy .env into process.env. getSecret reads .env in dev
 * and process.env at runtime in the Node adapter, and is never inlined in the
 * bundle the way import.meta.env would be.
 */
const runtimeEnv = (): Record<string, string | undefined> => ({
  OPENXBL_API_KEY: getSecret('OPENXBL_API_KEY'),
  SPOTIFY_CLIENT_ID: getSecret('SPOTIFY_CLIENT_ID'),
  SPOTIFY_CLIENT_SECRET: getSecret('SPOTIFY_CLIENT_SECRET'),
  SPOTIFY_REFRESH_TOKEN: getSecret('SPOTIFY_REFRESH_TOKEN'),
  GITHUB_TOKEN: getSecret('GITHUB_TOKEN'),
});

/** Bound on first call so a test can stub `fetch` before the sources run. */
export const loadNow = (): Promise<NowSnapshot> => {
  cached ??= createNowLoader({
    config: readNowConfig(runtimeEnv()),
    fetch: globalThis.fetch.bind(globalThis),
    now: () => Date.now(),
    logger: console,
  });
  return cached();
};
