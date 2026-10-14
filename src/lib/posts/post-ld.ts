import type { Post } from '../../content/schemas/post';
import { serialiseJsonLd as sharedSerialise } from '../aeo/json-ld';
import { personId } from '../home/person-ld';
import { ogImagePath } from '../og/pages';

interface PersonRef {
  '@type': 'Person';
  '@id': string;
  name: string;
  url: string;
}

export interface PostJsonLd {
  '@context': 'https://schema.org';
  '@type': 'TechArticle';
  name: string;
  headline: string;
  description: string;
  url: string;
  mainEntityOfPage: string;
  image: string;
  inLanguage: 'pt-BR';
  datePublished: string;
  dateModified: string;
  author?: PersonRef;
  publisher?: PersonRef;
}

/**
 * Technical posts use TechArticle. datePublished is required again now that
 * the archive surfaces the date on human pages (REQ-006 / REQ-015). The author
 * points at the home page Person by @id, which ties each text to the person
 * (SEO audit 2026-10-13, item 14).
 */
export const jsonLdForPost = (post: Post, site: string, author?: { name: string }): PostJsonLd => {
  const root = site.replace(/\/+$/, '');
  const url = `${root}/${post.slug}`;
  const published = post.publishedAt ?? post.date;
  const person: PersonRef | undefined = author
    ? { '@type': 'Person', '@id': personId(root), name: author.name, url: `${root}/` }
    : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    name: post.title,
    headline: post.title,
    description: post.summary,
    url,
    mainEntityOfPage: url,
    image: `${root}${ogImagePath(`/${post.slug}`)}`,
    inLanguage: 'pt-BR',
    datePublished: published,
    // Posts carry no edit date yet; Google accepts it equal to the publication.
    dateModified: published,
    ...(person ? { author: person, publisher: person } : {}),
  };
};

export const serialiseJsonLd = sharedSerialise;
