import type { Profile } from '../../content/schemas/profile';

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
  knowsAbout: string[];
  sameAs: string[];
}

const PUBLIC_PROFILE_KINDS = new Set(['github', 'linkedin', 'site']);

export const personLd = (profile: Profile, site: string): PersonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': personId(site),
  name: profile.name,
  jobTitle: profile.headline,
  description: profile.bio,
  url: site,
  knowsAbout: [...profile.stack],
  sameAs: profile.contacts
    .filter((contact) => PUBLIC_PROFILE_KINDS.has(contact.kind))
    .map((contact) => contact.value),
});
