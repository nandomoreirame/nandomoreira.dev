import { describe, expect, it } from 'vitest';
import { getProfile } from '../../src/lib/content';
import type { AvailabilityAnswer, ProfileAnswer } from '../../src/lib/mcp/tools/profile';
import { callTool } from './client';

describe('get_profile', () => {
  it('returns the same profile the site publishes', async () => {
    const result = await callTool<ProfileAnswer>('get_profile');
    const profile = await getProfile();

    expect(result.headline).toBe(profile.headline);
    expect(result.name).toBe(profile.name);
    expect(result.positioning).toBe(profile.positioning);
  });

  it('never exposes the e-mail through a tool', async () => {
    const payload = JSON.stringify(await callTool('get_profile'));

    expect(payload).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
  });

  it('omits the contact list entirely, rather than filtering it item by item', async () => {
    // Filtering invites the next contact kind to be forgotten; absence cannot.
    expect(await callTool('get_profile')).not.toHaveProperty('contacts');
  });

  it('carries the services with the case that proves each one', async () => {
    const result = await callTool<ProfileAnswer>('get_profile');
    const profile = await getProfile();

    expect(result.services).toHaveLength(profile.services.length);
    for (const service of result.services) {
      expect(service.caseSlug).toBeTruthy();
    }
  });
});

describe('check_availability', () => {
  it('returns availability with the date that lets an agent calibrate it', async () => {
    const result = await callTool<AvailabilityAnswer>('check_availability');
    const profile = await getProfile();

    expect(result.status).toBe(profile.availability.status);
    expect(result.updatedAt).toBe(profile.availability.updatedAt);
  });

  it('answers with a status the schema actually allows', async () => {
    const result = await callTool<AvailabilityAnswer>('check_availability');

    expect(['open', 'limited', 'closed']).toContain(result.status);
  });
});
