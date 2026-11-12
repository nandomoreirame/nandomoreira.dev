import { describe, expect, it } from 'vitest';
import type { Profile } from '../../src/content/schemas/profile';
import { getProfile } from '../../src/lib/content/profile';

/** The structure that must never drift between the two languages (REQ-021). */
const profileStructure = (profile: Profile) => ({
  name: profile.name,
  wordmark: profile.wordmark,
  contacts: profile.contacts,
  stack: profile.stack,
  availability: { status: profile.availability.status, updatedAt: profile.availability.updatedAt },
  services: profile.services.map(service => service.caseSlug),
  trajectory: profile.trajectory.length,
  work: (profile.work ?? []).map(({ name, url, startDate, endDate }) => ({ name, url, startDate, endDate })),
  education: (profile.education ?? []).map(({ institution, url, startDate, endDate }) => ({
    institution,
    url,
    startDate,
    endDate,
  })),
});

describe('English profile', async () => {
  const [pt, en] = await Promise.all([getProfile('pt-BR'), getProfile('en')]);

  it('matches the pt-BR structure (REQ-021, REQ-022)', () => {
    expect(profileStructure(en)).toEqual(profileStructure(pt));
  });

  it('is actually translated', () => {
    expect(en.headline).not.toBe(pt.headline);
    expect(en.bio).not.toBe(pt.bio);
    expect(en.availability.detail).not.toBe(pt.availability.detail);
  });

  it('has no dash in its prose', () => {
    expect(JSON.stringify(en)).not.toMatch(/[\u2013\u2014]/);
  });
});
