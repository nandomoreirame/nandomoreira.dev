interface Options {
  max: number;
  windowMs: number;
  /** Hard ceiling on tracked keys. Without it the map is an attacker-controlled leak. */
  maxKeys?: number;
}

export interface Limiter {
  check: (key: string) => boolean;
  /** Exposed so a test can assert the map stays bounded under a flood. */
  size: () => number;
}

const DEFAULT_MAX_KEYS = 10_000;

/**
 * In-memory and per instance.
 *
 * With `maxInstances: 2` the effective limit is up to twice `max`, and a
 * recycled instance resets the window. RISK-002 accepts this as approximate:
 * it raises the cost of casual abuse without pretending to be a guarantee.
 * Cloud Armor is the escalation, deliberately out of MVP scope.
 *
 * Stated here rather than discovered later by someone who trusted it.
 */
export const createLimiter = ({ max, windowMs, maxKeys = DEFAULT_MAX_KEYS }: Options): Limiter => {
  /** Map keeps insertion order, which is what makes the eviction below oldest-first. */
  const hits = new Map<string, number[]>();

  /**
   * Evicting only stale keys is not enough: an attacker sending distinct keys
   * keeps every one of them fresh, so nothing is ever stale and the map grows
   * without bound. So stale keys go first, and if that is not enough the
   * oldest-inserted go too, regardless of freshness.
   */
  const evict = (now: number) => {
    for (const [candidate, timestamps] of hits) {
      if (hits.size <= maxKeys) return;
      if (timestamps.every(at => now - at >= windowMs)) hits.delete(candidate);
    }

    for (const candidate of hits.keys()) {
      if (hits.size <= maxKeys) return;
      hits.delete(candidate);
    }
  };

  return {
    size: () => hits.size,
    check: (key: string): boolean => {
      const now = Date.now();
      const recent = (hits.get(key) ?? []).filter(at => now - at < windowMs);

      if (recent.length >= max) {
        // Keep the window, so hammering does not extend the ban indefinitely
        // nor reset it.
        hits.set(key, recent);

        return false;
      }

      recent.push(now);
      // Delete first so re-insertion moves the key to the end of the iteration
      // order, making eviction least-recently-used rather than arbitrary.
      hits.delete(key);
      hits.set(key, recent);

      if (hits.size > maxKeys) evict(now);

      return true;
    },
  };
};

/**
 * Google's load balancer APPENDS `<client-ip>, <lb-ip>` to whatever
 * `x-forwarded-for` arrived, so the LAST entry is the balancer and the one
 * before it is the real client. Anything earlier was sent by the caller and is
 * therefore forgeable: trusting the first value would let a single origin
 * rotate unlimited fake identities and walk past the limit entirely.
 *
 * With a single value (local runs, direct hits) there is no chain to strip.
 */
export const clientIpOf = (headers: Headers): string => {
  const chain = (headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean);

  if (chain.length >= 2) return chain[chain.length - 2];
  if (chain.length === 1) return chain[0];

  return headers.get('x-real-ip')?.trim() || 'unknown';
};
