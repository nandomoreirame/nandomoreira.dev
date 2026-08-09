import type { Post } from '../../content/schemas/post';
import { serialiseJsonLd as sharedSerialise } from '../aeo/json-ld';

export interface PostJsonLd {
  '@context': 'https://schema.org';
  '@type': 'TechArticle';
  name: string;
  headline: string;
  description: string;
  url: string;
}

/**
 * Short technical notes use TechArticle. The ordering date stays out of the
 * payload on purpose (REQ-002): human and machine surfaces agree that the
 * date is not part of the published note.
 */
export const jsonLdForPost = (note: Post, site: string): PostJsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'TechArticle',
  name: note.title,
  headline: note.title,
  description: note.summary,
  url: `${site}/notas/${note.slug}`,
});

export const serialiseJsonLd = sharedSerialise;
