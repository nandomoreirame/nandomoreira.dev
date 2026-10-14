import { personId } from '../home/person-ld';
import { absoluteUrl } from './urls';

export type PageType = 'WebPage' | 'ProfilePage' | 'CollectionPage';

type MainEntity =
  | { '@id': string }
  | { '@type': 'ItemList'; itemListElement: { '@type': 'ListItem'; position: number; url: string }[] };

export interface WebPageLd {
  '@context': 'https://schema.org';
  '@type': PageType;
  name: string;
  description: string;
  url: string;
  inLanguage: 'pt-BR';
  isPartOf: { '@type': 'WebSite'; url: string };
  mainEntity?: MainEntity;
}

/**
 * The page itself, on every page; specific things (Person, case) sit beside it.
 * The about page is a ProfilePage of the Person, and listings are
 * CollectionPages with their items in order (SEO audit 2026-10-13, item 15).
 */
export const webPageLd = ({
  site,
  path,
  title,
  description,
  type = 'WebPage',
  items = [],
}: {
  site: URL;
  path: string;
  title: string;
  description: string;
  type?: PageType;
  /** Root-relative paths listed by a CollectionPage. */
  items?: readonly string[];
}): WebPageLd => {
  const mainEntity: MainEntity | undefined =
    type === 'ProfilePage'
      ? { '@id': personId(site.toString()) }
      : type === 'CollectionPage' && items.length > 0
        ? {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              url: absoluteUrl(site, item),
            })),
          }
        : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description,
    url: absoluteUrl(site, path),
    inLanguage: 'pt-BR',
    isPartOf: { '@type': 'WebSite', url: site.toString() },
    ...(mainEntity ? { mainEntity } : {}),
  };
};
