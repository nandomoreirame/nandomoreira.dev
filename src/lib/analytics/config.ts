export interface AnalyticsConfig {
  hashSecret: string | null;
  selfToken: string | null;
}

const MIN_SECRET = 32;

const secretOf = (value: string | undefined): string | null => {
  const text = (value ?? '').trim();
  return text.length >= MIN_SECRET ? text : null;
};

/**
 * Missing or weak is off, never an error: measuring is optional and must not
 * keep the site from booting the way a missing mail secret should (REQ-005).
 */
export const readAnalyticsConfig = (env: Record<string, string | undefined>): AnalyticsConfig => ({
  hashSecret: secretOf(env.ANALYTICS_HASH_SECRET),
  selfToken: secretOf(env.ANALYTICS_SELF_TOKEN),
});
