import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CLIENT_ASSETS = 'dist/client/_astro';

describe('client bundle', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist')).toBe(true);
  });

  it('ships no client-side JavaScript, per the P0 architecture decision', () => {
    expect(
      existsSync(CLIENT_ASSETS),
      `expected client asset dir at ${CLIENT_ASSETS} after a build`,
    ).toBe(true);

    const scripts = readdirSync(CLIENT_ASSETS).filter((file) => file.endsWith('.js'));
    expect(scripts).toEqual([]);
  });
});
