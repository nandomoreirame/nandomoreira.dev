import { getCollection } from 'astro:content';
import type { Profile } from '../../content/schemas/profile';
import { withCareerYears } from '../format/career-years';
import type { Locale } from '../i18n/locale';

export type Availability = Profile['availability'];

export const toAvailability = (availability: Availability): Availability => availability;

export const applyCareerYears = (profile: Profile, now?: Date, locale: Locale = 'pt-BR'): Profile => ({
  ...profile,
  bio: withCareerYears(profile.bio, now, locale),
  trajectory: profile.trajectory.map(item => ({
    ...item,
    value: withCareerYears(item.value, now, locale),
    label: withCareerYears(item.label, now, locale),
    context: withCareerYears(item.context, now, locale),
  })),
});

export const getProfile = async (locale: Locale = 'pt-BR'): Promise<Profile> => {
  const entries = await getCollection(locale === 'en' ? 'profileEn' : 'profile');

  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one profile entry, found ${entries.length}. The profile is the single source of truth.`,
    );
  }

  return applyCareerYears(entries[0].data, undefined, locale);
};

/** F6.5: check_availability must return the status together with its date. */
export const getAvailability = async (locale: Locale = 'pt-BR'): Promise<Availability> =>
  toAvailability((await getProfile(locale)).availability);
