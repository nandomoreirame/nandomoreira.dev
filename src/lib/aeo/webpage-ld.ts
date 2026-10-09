import { absoluteUrl } from './urls';

export interface WebPageLd {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  inLanguage: 'pt-BR';
  isPartOf: { '@type': 'WebSite'; url: string };
}

/** The page itself, on every page; specific things (Person, case) sit beside it. */
export const webPageLd = ({
  site,
  path,
  title,
  description,
}: {
  site: URL;
  path: string;
  title: string;
  description: string;
}): WebPageLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description,
  url: absoluteUrl(site, path),
  inLanguage: 'pt-BR',
  isPartOf: { '@type': 'WebSite', url: site.toString() },
});
