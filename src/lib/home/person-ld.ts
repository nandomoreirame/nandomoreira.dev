import type { Profile } from '../../content/schemas/profile';
import { portraitUrl } from '../about/portrait';

/** Stable identity of the author, referenced by every article's author. */
export const personId = (site: string): string => `${site.replace(/\/+$/, '')}/#person`;

export interface PersonLd {
  '@context': 'https://schema.org';
  '@type': 'Person';
  '@id': string;
  name: string;
  jobTitle: string;
  description: string;
  url: string;
  image: string;
  knowsAbout: string[];
  sameAs: string[];
}

const PUBLIC_PROFILE_KINDS = new Set(['github', 'linkedin', 'site']);

/**
 * The public profile URLs: sameAs in the JSON-LD and rel=me in the head. The
 * visible links go through /go, so the identity assertion lives in the head.
 */
export const profileUrls = (contacts: Profile['contacts']): string[] =>
  contacts.filter(contact => PUBLIC_PROFILE_KINDS.has(contact.kind)).map(contact => contact.value);

export const personLd = (profile: Profile, site: string): PersonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': personId(site),
  name: profile.name,
  jobTitle: profile.headline,
  description: profile.bio,
  url: site,
  image: portraitUrl(site),
  knowsAbout: [...profile.stack],
  sameAs: profileUrls(profile.contacts),
});
