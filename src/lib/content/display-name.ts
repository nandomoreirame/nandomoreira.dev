import type { Profile } from '../../content/schemas/profile';

/** The name people see on the pages; agents and the résumé read `profile.name`. */
export const displayNameOf = (profile: Pick<Profile, 'name' | 'displayName'>): string =>
  profile.displayName ?? profile.name;
