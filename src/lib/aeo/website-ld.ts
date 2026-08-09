export interface WebSiteLd {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  inLanguage: 'pt-BR';
}

export const websiteLd = (site: URL, name: string): WebSiteLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name,
  url: site.toString(),
  inLanguage: 'pt-BR',
});
