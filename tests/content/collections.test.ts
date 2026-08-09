import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = readFileSync('src/content.config.ts', 'utf8');

describe('content collections', () => {
  it('declares both collections', () => {
    expect(config).toContain('projects');
    expect(config).toContain('profile');
  });

  it('reuses the tested schemas instead of redeclaring them inline', () => {
    expect(config).toContain("from './content/schemas/project'");
    expect(config).toContain("from './content/schemas/profile'");
  });
});
