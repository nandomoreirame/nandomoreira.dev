import type { Locale } from './locale';

export type RoutePair = Record<Locale, string>;

/**
 * Human pages that exist in both languages (spec route map). Content pages
 * (cases, posts) pair through their translations, in src/lib/i18n/alternates.ts.
 * The archive has no English side (D12). /releases and /releases/17 neither (D14).
 * The sales pages are i18n-sales.
 */
export const STATIC_ROUTES: readonly RoutePair[] = [
  { 'pt-BR': '/', en: '/en' },
  { 'pt-BR': '/portfolio', en: '/en/portfolio' },
  { 'pt-BR': '/lab', en: '/en/lab' },
  { 'pt-BR': '/posts', en: '/en/posts' },
  { 'pt-BR': '/sobre', en: '/en/about' },
  { 'pt-BR': '/contato', en: '/en/contact' },
  { 'pt-BR': '/curriculo', en: '/en/resume' },
  { 'pt-BR': '/mcp', en: '/en/mcp' },
  { 'pt-BR': '/setup', en: '/en/setup' },
  { 'pt-BR': '/now', en: '/en/now' },
  { 'pt-BR': '/privacidade', en: '/en/privacy' },
];

export const staticCounterpart = (path: string): RoutePair | undefined =>
  STATIC_ROUTES.find((route) => route['pt-BR'] === path || route.en === path);

/** The path of a static page in `locale`, from its pt-BR path. Throws on a typo. */
export const routeFor = (ptPath: string, locale: Locale): string => {
  const pair = STATIC_ROUTES.find((route) => route['pt-BR'] === ptPath);
  if (!pair) throw new Error(`No static route for ${ptPath}`);
  return pair[locale];
};
