import { clientIpOf } from '../hire/rate-limit';
import { saoPauloDay } from '../now/day';
import { utmOf } from './channel';
import type { AnalyticsConfig } from './config';
import { type Conversion, type EventKind, type EventSource, buildEvent } from './event';
import { renderJourney } from './journey';
import type { AnalyticsStore } from './store';
import { visitorHash } from './visitor';

export const SELF_COOKIE = 'nm_self';

export const isSelf = (headers: Headers): boolean =>
  (headers.get('cookie') ?? '').split(';').some((pair) => pair.trim() === `${SELF_COOKIE}=1`);

/** Resolves undefined on timeout or failure; measuring never breaks a response. */
export const withTimeout = async <T>(work: Promise<T>, ms: number): Promise<T | undefined> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<undefined>((resolve) => {
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
  record: (request: Request, hit: Hit) => Promise<void>;
  /** Today's pages of the visitor behind this request, as notification text. */
  journey: (request: Request) => Promise<string>;
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

  return {
    record: async (request, hit) => {
      const secret = config.hashSecret;
      if (!secret || isSelf(request.headers)) return;

      const at = now();
      const day = saoPauloDay(at);
      const event = buildEvent({
        kind: hit.kind,
        at,
        day,
        visitor: visitorOf(secret, request, day),
        userAgent: request.headers.get('user-agent'),
        source: hit.source,
        path: hit.path,
        referrer: hit.referrer,
        utm: utmOf(hit.search ?? new URLSearchParams()),
        country: request.headers.get('cf-ipcountry'),
        conversion: hit.conversion,
      });

      // The 250 ms ceiling (REQ-001): Cloud Run throttles the CPU once the
      // response is out, so an unawaited write could simply never happen.
      await withTimeout(store.record(event), timeoutMs);
    },

    journey: async (request) => {
      const secret = config.hashSecret;
      if (!secret) return renderJourney([]);

      const day = saoPauloDay(now());
      const events = await withTimeout(store.eventsOf(day, visitorOf(secret, request, day)), timeoutMs);
      return renderJourney(events ?? []);
    },
  };
};
