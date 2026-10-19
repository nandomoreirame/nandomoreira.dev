import { getSecret } from 'astro:env/server';
import { createCachedSource } from '../now/cache';
import { SOURCE_TIMEOUT_MS, SourceError, logSourceError } from '../now/http';
import { RECORDED_COMMITS } from './history';

/**
 * Commits of this repository for the version tag (v17.<commits>), read from
 * the GitHub API: one commit per page, so the page number of rel="last" is
 * the count. The repository is public, so no token is needed; the runtime
 * token only lifts the rate limit.
 */
const COMMITS_URL = 'https://api.github.com/repos/nandomoreirame/nandomoreira.dev/commits?sha=main&per_page=1';

const COMMITS_TTL_MS = 60 * 60 * 1000;

export const commitCountFrom = (linkHeader: string | null, items: number): number | undefined => {
  if (!linkHeader) return items;
  const last = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return last ? Number(last[1]) : undefined;
};

export const fetchCommitCount = async ({ fetch: fetchImpl, token }: { fetch: typeof fetch; token?: string }) => {
  const headers: Record<string, string> = { accept: 'application/vnd.github+json', 'user-agent': 'nandomoreira.dev' };
  if (token) headers.authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetchImpl(COMMITS_URL, { headers, signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS) });
  } catch {
    throw new SourceError('network');
  }
  if (!response.ok) throw new SourceError('status', response.status);
  const body = (await response.json()) as unknown;
  const count = commitCountFrom(response.headers.get('link'), Array.isArray(body) ? body.length : 0);
  if (!count) throw new SourceError('shape');
  return count;
};

/**
 * Cached for an hour per instance. Any failure, or a count below the one
 * recorded when the history was written, serves RECORDED_COMMITS instead.
 */
export const createCommitsLoader = ({
  fetch: fetchImpl,
  token,
  now = Date.now,
  logger = console,
}: {
  fetch: typeof fetch;
  token?: string;
  now?: () => number;
  logger?: Pick<Console, 'warn'>;
}) => {
  const source = createCachedSource({
    ttlMs: COMMITS_TTL_MS,
    load: () => fetchCommitCount({ fetch: fetchImpl, token }),
    now,
  });
  return async (): Promise<number> => {
    try {
      const count = await source();
      return count >= RECORDED_COMMITS ? count : RECORDED_COMMITS;
    } catch (error) {
      logSourceError('github commits', error, logger);
      return RECORDED_COMMITS;
    }
  };
};

let cached: ReturnType<typeof createCommitsLoader> | undefined;

/**
 * Every page renders the footer, so the unit suite never reaches GitHub from
 * here: under Vitest the recorded count stands in.
 */
export const loadSiteCommits = (): Promise<number> => {
  if (process.env.VITEST) return Promise.resolve(RECORDED_COMMITS);
  cached ??= createCommitsLoader({ fetch: globalThis.fetch.bind(globalThis), token: getSecret('GITHUB_TOKEN') });
  return cached();
};
