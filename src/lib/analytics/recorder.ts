import { clientIpOf } from '../hire/rate-limit';
import { saoPauloDay } from '../now/day';
import { utmOf } from './channel';
import type { AnalyticsConfig } from './config';
import { type Conversion, type EventKind, type EventSource, buildEvent } from './event';
import { type JourneyData, journeyOf } from './journey';
import type { AnalyticsStore } from './store';
import { visitorHash } from './visitor';

/**
 * Firebase App Hosting forwards only the cookie named `__session` to the
 * server and drops every other one from the request: an `nm_self` cookie
 * reached the browser but never the recorder, so the author was counted.
 */
export const SELF_COOKIE = '__session';
export const SELF_VALUE = 'self';

export const isSelf = (headers: Headers): boolean =>
  (headers.get('cookie') ?? '').split(';').some(pair => pair.trim() === `${SELF_COOKIE}=${SELF_VALUE}`);

/** Resolves undefined on timeout or failure; measuring never breaks a response. */
export const withTimeout = async <T>(work: Promise<T>, ms: number): Promise<T | undefined> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<undefined>(resolve => {
        timer = setTimeout(() => resolve(undefined), ms);
      }),
    ]);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
};

export interface Hit {
  kind: EventKind;
  path: string;
  source: EventSource;
  referrer: string | null;
  search?: URLSearchParams;
  conversion?: Conversion;
}

export interface Recorder {
  /** False when nothing would be written: no secret, or the author's cookie. */
  active: (request: Request) => boolean;
  record: (request: Request, hit: Hit) => Promise<void>;
  /** Several hits of one request in a single write. */
  recordAll: (request: Request, hits: readonly Hit[]) => Promise<void>;
  /** Today's pages of the visitor behind this request, for the lead mail. */
  journey: (request: Request) => Promise<JourneyData | undefined>;
}

export const createRecorder = ({
  store,
  config,
  now,
  timeoutMs = 250,
}: {
  store: AnalyticsStore;
  config: AnalyticsConfig;
  now: () => Date;
  timeoutMs?: number;
}): Recorder => {
  const visitorOf = (secret: string, request: Request, day: string): string =>
    visitorHash({ secret, day, ip: clientIpOf(request.headers), userAgent: request.headers.get('user-agent') });

  const active = (request: Request): boolean => config.hashSecret !== null && !isSelf(request.headers);

  const recordAll = async (request: Request, hits: readonly Hit[]): Promise<void> => {
    const secret = config.hashSecret;
    if (!secret || hits.length === 0 || isSelf(request.headers)) return;

    const at = now();
    const day = saoPauloDay(at);
    const visitor = visitorOf(secret, request, day);
    const events = hits.map(hit =>
      buildEvent({
        kind: hit.kind,
        at,
        day,
        visitor,
        userAgent: request.headers.get('user-agent'),
        source: hit.source,
        path: hit.path,
        referrer: hit.referrer,
        utm: utmOf(hit.search ?? new URLSearchParams()),
        country: request.headers.get('cf-ipcountry'),
        // Sent only with Cloudflare's "Add visitor location headers" on.
        city: request.headers.get('cf-ipcity'),
        region: request.headers.get('cf-region'),
        conversion: hit.conversion,
      }),
    );

    // The 250 ms ceiling (REQ-001): Cloud Run throttles the CPU once the
    // response is out, so an unawaited write could simply never happen.
    await withTimeout(store.record(events), timeoutMs);
  };

  return {
    active,
    recordAll,
    record: (request, hit) => recordAll(request, [hit]),

    journey: async request => {
      const secret = config.hashSecret;
      if (!secret) return undefined;

      const day = saoPauloDay(now());
      const events = await withTimeout(store.eventsOf(day, visitorOf(secret, request, day)), timeoutMs);
      if (events === undefined) return undefined;

      try {
        const data = journeyOf(events);
        return data.views.length > 0 ? data : undefined;
      } catch {
        return undefined;
      }
    },
  };
};
