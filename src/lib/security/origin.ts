export const originAllowed = (origin: string | null, allowed: readonly string[]): boolean =>
  origin === null || allowed.includes(origin);
