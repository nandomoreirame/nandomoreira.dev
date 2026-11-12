import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getProfile } from '../../src/lib/content/profile';

const barrel = readFileSync('src/lib/content/index.ts', 'utf8');

describe('content access barrel', () => {
  it.each([
    'getAllProjects',
    'getFeaturedProjects',
    'getProjectsByBlock',
    'getProject',
    'getProfile',
    'getAvailability',
  ])('exports %s, so every surface has one way in', symbol => {
    expect(barrel).toContain(symbol);
  });

  it('serves the English profile with the English career label', async () => {
    const profile = await getProfile('en');
    expect(profile.bio).not.toContain('{anos}');
    expect(profile.bio).not.toMatch(/\+\d+ anos/);
  });
});
