export interface CachedSourceOptions<T> {
  ttlMs: number;
  load: () => Promise<T>;
  now?: () => number;
}

/**
 * Per-instance memory cache for one external source. A failed refresh keeps
 * serving the last good value (REQ-012); only a source that never answered
 * rejects, which the caller turns into a fallback section.
 */
export const createCachedSource = <T>({ ttlMs, load, now = Date.now }: CachedSourceOptions<T>) => {
  let value: { data: T; at: number } | undefined;
  let inflight: Promise<T> | undefined;

  return async (): Promise<T> => {
    if (value && now() - value.at < ttlMs) return value.data;
    inflight ??= load()
      .then((data) => {
        value = { data, at: now() };
        return data;
      })
      .catch((error: unknown) => {
        if (value) return value.data;
        throw error;
      })
      .finally(() => {
        inflight = undefined;
      });
    return inflight;
  };
};
