import { getCollection } from 'astro:content';
import type { Profile } from '../../content/schemas/profile';

export type Availability = Profile['availability'];

export const toAvailability = (availability: Availability): Availability => availability;

export const getProfile = async (): Promise<Profile> => {
  const entries = await getCollection('profile');

  if (entries.length !== 1) {
    throw new Error(
      `Expected exactly one profile entry, found ${entries.length}. The profile is the single source of truth.`,
    );
  }

  return entries[0].data;
};

/** F6.5: check_availability must return the status together with its date. */
export const getAvailability = async (): Promise<Availability> =>
  toAvailability((await getProfile()).availability);
