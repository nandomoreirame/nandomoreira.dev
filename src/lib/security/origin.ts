export const originAllowed = (origin: string | null, allowed: readonly string[]): boolean =>
  origin === null || allowed.includes(origin);

/** Production, local dev and the homelab staging host. `ALLOWED_ORIGINS` replaces the list. */
const DEFAULT_ORIGINS = [
  'https://nandomoreira.dev',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://nandomoreira.home',
];

export const originsFromEnv = (env: Record<string, string | undefined>): readonly string[] => {
  const raw = env.ALLOWED_ORIGINS?.trim();
  if (!raw) return DEFAULT_ORIGINS;
  return raw.split(',').map(item => item.trim()).filter(item => item.length > 0);
};
