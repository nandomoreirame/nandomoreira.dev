import type { Locale } from '../i18n/locale';

/** Public service names keep the API service identifiers unchanged. */
export const SALES_SLUGS_EN: Readonly<Record<string, string>> = {
  'site-institucional': 'website',
  'landing-page': 'landing-page',
  blog: 'blog',
  'loja-virtual': 'online-store',
  'produto-web': 'web-product',
  'automacao-ia': 'ai-automation',
};

const englishByPortuguese = new Map(Object.entries(SALES_SLUGS_EN));
const portugueseByEnglish = new Map(Object.entries(SALES_SLUGS_EN).map(([pt, en]) => [en, pt]));

/** Accept a slug in either language, rejecting unknown and inherited names. */
export const salesSlugIn = (slug: string, locale: Locale): string | undefined => {
  if (locale === 'en') return englishByPortuguese.get(slug) ?? (portugueseByEnglish.has(slug) ? slug : undefined);
  return portugueseByEnglish.get(slug) ?? (englishByPortuguese.has(slug) ? slug : undefined);
};
