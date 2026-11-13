import type { Locale } from '../i18n/locale';

export interface WebSiteLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  inLanguage: Locale;
}

export const websiteLd = (site: URL, name: string, locale: Locale = 'pt-BR'): WebSiteLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  url: site.toString(),
  inLanguage: locale,
});
