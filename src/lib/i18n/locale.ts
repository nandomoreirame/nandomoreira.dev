/**
 * The site's languages (i18n-foundation). pt-BR lives at the root, unchanged;
 * English lives under /en with translated slugs (D1, D2). Astro's built-in
 * i18n routing is not used: it assumes the same path in every language (D4).
 */
export const LOCALES = ['pt-BR', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-BR';

const EN_PREFIX = '/en';

/** REQ-001: exactly /en, or anything under /en/, is English. */
export const localeOfPath = (path: string): Locale =>
  path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`) ? 'en' : 'pt-BR';

/** The path without its locale prefix; the English root becomes '/'. */
export const stripLocale = (path: string): string => {
  if (localeOfPath(path) !== 'en') return path;
  const rest = path.slice(EN_PREFIX.length).replace(/\/+$/, '');
  return rest === '' ? '/' : rest;
};

/** Root-relative path of `path` in `locale`. Idempotent. */
export const withLocale = (path: string, locale: Locale): string => {
  if (locale === 'pt-BR') return path;
  if (localeOfPath(path) === 'en') return path;
  return path === '/' ? EN_PREFIX : `${EN_PREFIX}${path}`;
};

export const htmlLang = (locale: Locale): string => locale;

/** Open Graph wants an underscore and a region. */
export const ogLocale = (locale: Locale): string => (locale === 'en' ? 'en_US' : 'pt_BR');
