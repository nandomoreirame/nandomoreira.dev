import { getCollection } from 'astro:content';
import type { Profile } from '../../content/schemas/profile';
import { withCareerYears } from '../format/career-years';

export type Availability = Profile['availability'];

export const toAvailability = (availability: Availability): Availability => availability;

export const applyCareerYears = (profile: Profile, now?: Date): Profile => ({
  ...profile,
  bio: withCareerYears(profile.bio, now),
  trajectory: profile.trajectory.map(item => ({
    ...item,
    value: withCareerYears(item.value, now),
    label: withCareerYears(item.label, now),
    context: withCareerYears(item.context, now),
  })),
});

export const getProfile = async (): Promise<Profile> => {
  const entries = await getCollection('profile');

  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one profile entry, found ${entries.length}. The profile is the single source of truth.`,
    );
  }

  return applyCareerYears(entries[0].data);
};

/** F6.5: check_availability must return the status together with its date. */
export const getAvailability = async (): Promise<Availability> => toAvailability((await getProfile()).availability);
