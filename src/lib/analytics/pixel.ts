import { pagePath } from '../aeo/urls';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import type { Recorder } from './recorder';

/** The canonical 43-byte transparent GIF89a. */
const GIF = Uint8Array.from(
  atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
  (char) => char.charCodeAt(0),
);

const gif = (): Response =>
  new Response(GIF, {
    status: 200,
    headers: { 'content-type': 'image/gif', 'cache-control': 'no-store', 'content-length': String(GIF.length) },
  });

const refererPage = (referer: string | null, ownHosts: readonly string[]) => {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return ownHosts.includes(url.hostname) ? { path: pagePath(url.pathname), search: url.searchParams } : null;
  } catch {
    return null;
  }
};

/**
 * Counts a visit to a prerendered page (REQ-003). The answer never changes, so
 * a probe learns nothing from it; only a same-site referer naming a real page,
 * within the per-IP limit, is written.
 */
export const handlePixel = async (
  request: Request,
  deps: {
    recorder: Pick<Recorder, 'record'>;
    limiter: Limiter;
    knownPaths: () => Promise<ReadonlySet<string>>;
    ownHosts: readonly string[];
  },
): Promise<Response> => {
  const page = request.method === 'GET' ? refererPage(request.headers.get('referer'), deps.ownHosts) : null;

  if (page && (await deps.knownPaths()).has(page.path) && deps.limiter.check(clientIpOf(request.headers))) {
    await deps.recorder.record(request, { kind: 'pageview', path: page.path, source: 'pixel', referrer: null, search: page.search });
  }

  return gif();
};
