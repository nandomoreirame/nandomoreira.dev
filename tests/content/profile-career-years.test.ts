import { describe, expect, it } from 'vitest';
import { careerYearsLabel } from '../../src/lib/format/career-years';
import { applyCareerYears } from '../../src/lib/content/profile';
import { getProfile } from '../../src/lib/content';

describe('career years on the profile', () => {
  it('fills the marker in the bio and in the trajectory, and nothing else', () => {
    const now = new Date('2026-10-18T12:00:00Z');
    const profile = applyCareerYears(
      {
        bio: 'Construo software há {anos}.',
        trajectory: [{ value: '{anos}', label: 'construindo software', context: 'Desde 2011.' }],
      } as never,
      now,
    );
    expect(profile.bio).toBe('Construo software há +15 anos.');
    expect(profile.trajectory[0]).toEqual({ value: '+15 anos', label: 'construindo software', context: 'Desde 2011.' });
  });

  it('serves the computed label from getProfile, with no marker left', async () => {
    const profile = await getProfile();
    expect(profile.bio).toContain(careerYearsLabel());
    expect(JSON.stringify(profile)).not.toContain('{anos}');
    expect(profile.trajectory.map(item => item.value)).toContain(careerYearsLabel());
  });
});
