import type { Profile } from '../../../content/schemas/profile';

/**
 * The public shape of the profile as a tool answers it.
 *
 * `contacts` is absent on purpose: no machine surface publishes an e-mail, and
 * an agent that wants to make contact uses POST /api/hire (REQ-004 of the
 * structured-resume spec, and the same constraint here).
 */
export interface ProfileAnswer {
  name: string;
  headline: string;
  bio: string;
  positioning: string;
  stack: string[];
  services: Array<{ title: string; description: string; caseSlug: string }>;
  availability: AvailabilityAnswer;
}

export interface AvailabilityAnswer {
  status: Profile['availability']['status'];
  detail: string;
  /** Without the date an agent cannot tell a fresh answer from a stale one. */
  updatedAt: string;
}

export const toAvailabilityAnswer = (profile: Profile): AvailabilityAnswer => ({
  status: profile.availability.status,
  detail: profile.availability.detail,
  updatedAt: profile.availability.updatedAt,
});

export const toProfileAnswer = (profile: Profile): ProfileAnswer => ({
  name: profile.name,
  headline: profile.headline,
  bio: profile.bio,
  positioning: profile.positioning,
  stack: [...profile.stack],
  services: profile.services.map(service => ({ ...service })),
  availability: toAvailabilityAnswer(profile),
});
