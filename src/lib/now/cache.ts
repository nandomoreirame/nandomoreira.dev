import { NOW_FAILURE_TTL_MS } from './now';

export interface CachedSourceOptions<T> {
  ttlMs: number;
  failureTtlMs?: number;
  load: () => Promise<T>;
  now?: () => number;
}

/**
 * Per-instance memory cache for one external source. A failed refresh keeps
 * serving the last good value (REQ-012); only a source that never answered
 * rejects, which the caller turns into a fallback section. Either failure
 * stays remembered for failureTtlMs so a dead source is not retried per request.
 */
export const createCachedSource = <T>({
  ttlMs,
  failureTtlMs = NOW_FAILURE_TTL_MS,
  load,
  now = Date.now,
}: CachedSourceOptions<T>) => {
  let value: { data: T; at: number } | undefined;
  let failure: { error: unknown; at: number } | undefined;
  let inflight: Promise<T> | undefined;

  return async (): Promise<T> => {
    if (value && now() - value.at < ttlMs) return value.data;
    if (!value && failure && now() - failure.at < failureTtlMs) throw failure.error;

    inflight ??= load()
      .then((data) => {
        value = { data, at: now() };
        failure = undefined;
        return data;
      })
      .catch((error: unknown) => {
        if (value) {
          value = { data: value.data, at: now() - ttlMs + failureTtlMs };
          return value.data;
        }
        failure = { error, at: now() };
        throw error;
      })
      .finally(() => {
        inflight = undefined;
      });
    return inflight;
  };
};
