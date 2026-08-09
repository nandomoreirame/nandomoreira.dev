import type { Post } from '../../content/schemas/post';
import { serialiseJsonLd as sharedSerialise } from '../aeo/json-ld';

export interface PostJsonLd {
  '@context': 'https://schema.org';
  '@type': 'TechArticle';
  name: string;
  headline: string;
  description: string;
  url: string;
  datePublished: string;
}

/**
 * Technical posts use TechArticle. datePublished is required again now that
 * the archive surfaces the date on human pages (REQ-006 / REQ-015).
 */
export const jsonLdForPost = (post: Post, site: string): PostJsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: post.title,
  headline: post.title,
  description: post.summary,
  url: `${site}/${post.slug}`,
  datePublished: post.date,
});

export const serialiseJsonLd = sharedSerialise;
