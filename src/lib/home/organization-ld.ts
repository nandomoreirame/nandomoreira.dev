import type { Profile } from '../../content/schemas/profile';
import { absoluteUrl } from '../aeo/urls';

export interface OrganizationLd {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  founder: { '@type': 'Person'; name: string };
}

const PUBLIC_PROFILE_KINDS = new Set(['github', 'linkedin']);

/**
 * The site's brand (the wordmark), founded by the person the site is about.
 * There is no company behind it; this is how a personal brand is modelled so
 * consumers that look for an Organization find the name, logo and profiles.
 */
export const organizationLd = (profile: Profile, site: URL): OrganizationLd => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: profile.wordmark ?? site.hostname,
  url: site.toString(),
  logo: absoluteUrl(site, '/logo.png'),
  sameAs: profile.contacts.filter(contact => PUBLIC_PROFILE_KINDS.has(contact.kind)).map(contact => contact.value),
  founder: { '@type': 'Person', name: profile.name },
});
