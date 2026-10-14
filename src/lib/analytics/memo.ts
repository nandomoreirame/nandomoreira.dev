/**
 * A per-process cache for a table built from content (the sitemap pages, the
 * /go destinations), which only changes with a deploy. A failed load is not
 * kept: caching the rejected promise would fail every later request until the
 * instance is recycled.
 */
export const cachedUnlessRejected = <T>(load: () => Promise<T>): (() => Promise<T>) => {
  let cached: Promise<T> | undefined;
  return () => {
    if (!cached) {
      cached = load();
      cached.catch(() => {
        cached = undefined;
      });
    }
    return cached;
  };
};
