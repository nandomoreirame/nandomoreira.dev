import { UPCOMING_LIMIT } from '../../components/posts/upcoming-limit';
import { getAvailability, getCurrentPosts, getUpcomingPosts } from '../content';
import type { Post } from '../../content/schemas/post';
import { createCachedSource } from './cache';
import { readNowConfig, type NowConfig } from './config';
import { fetchActiveRepos, type ActiveRepo } from './github';
import { logSourceError } from './http';
import { NOW_DECLINING, NOW_FOCUS, NOW_GAMES, NOW_REPO_EXCLUDE, NOW_TTL } from './now';
import { fetchRecentTracks, type RecentTrack } from './spotify';
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

export interface NowSnapshot {
  projects: Section<ActiveRepo[]>;
  music: Section<RecentTrack[]>;
  games: GamesSection;
  writing: { latest: Post | undefined; drafts: string[] };
  focus: { items: readonly string[]; declining: readonly string[]; availability: string };
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
}: {
  config: NowConfig;
  fetch: typeof fetch;
  now?: () => number;
  logger?: Pick<Console, 'warn'>;
  fallbackGames?: readonly { name: string; note?: string }[];
}) => {
  const clock = () => new Date(now());
  const spotifyConfig = config.spotify;
  const xboxConfig = config.xbox;
  const github = createCachedSource({
    ttlMs: NOW_TTL.github,
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
        now,
        load: () => fetchRecentTracks({ fetch: fetchImpl, ...spotifyConfig, now: clock() }),
      })
    : undefined;
  const xbox = xboxConfig
    ? createCachedSource({
        ttlMs: NOW_TTL.xbox,
        now,
        load: () => fetchXbox({ fetch: fetchImpl, apiKey: xboxConfig.apiKey }),
      })
    : undefined;

  return async (): Promise<NowSnapshot> => {
    const [[projectsResult, musicResult, gamesResult], posts, drafts, availability] = await Promise.all([
      Promise.allSettled([
        github(),
        spotify ? spotify() : Promise.resolve('unconfigured' as const),
        xbox ? xbox() : Promise.resolve('unconfigured' as const),
      ]),
      getCurrentPosts(),
      getUpcomingPosts(),
      getAvailability(),
    ]);

    const projects =
      projectsResult.status === 'rejected'
        ? (logSourceError('github', projectsResult.reason, logger), { state: 'empty' as const })
        : arraySection(projectsResult.value);

    const music =
      musicResult.status === 'rejected'
        ? (logSourceError('spotify', musicResult.reason, logger), { state: 'empty' as const })
        : musicResult.value === 'unconfigured'
          ? { state: 'empty' as const }
          : arraySection(musicResult.value);

    const games = gamesSection(gamesResult, fallbackGames, logger);

    return {
      projects,
      music,
      games,
      writing: {
        latest: posts[0],
        drafts: drafts.slice(0, UPCOMING_LIMIT).map((post) => post.title),
      },
      focus: {
        items: NOW_FOCUS,
        declining: NOW_DECLINING,
        availability: availability.detail,
      },
    };
  };
};

let cached: ReturnType<typeof createNowLoader> | undefined;

/** Bound on first call so a test can stub `fetch` before the sources run. */
export const loadNow = (): Promise<NowSnapshot> => {
  cached ??= createNowLoader({
    config: readNowConfig(process.env),
    fetch: globalThis.fetch.bind(globalThis),
    now: () => Date.now(),
    logger: console,
  });
  return cached();
};
