import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const barrel = readFileSync('src/lib/content/index.ts', 'utf8');

describe('content access barrel', () => {
  it.each([
    'getAllProjects',
    'getFeaturedProjects',
    'getProjectsByBlock',
    'getProject',
    'getProfile',
    'getAvailability',
  ])('exports %s, so every surface has one way in', (symbol) => {
    expect(barrel).toContain(symbol);
  });
});
