import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Requires `npm run build`. Runs from vitest.build.config.ts, never from
// `npm test`: `dist/` is gitignored, so a fresh clone has nothing to assert on.
describe('astro node adapter (standalone)', () => {
  it('emits a standalone server entrypoint after build', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });

  it('emits it at the exact path apphosting.yaml runs', () => {
    const runCommand = readFileSync('apphosting.yaml', 'utf8')
      .split('\n')
      .find((line: string) => line.includes('runCommand'));

    expect(runCommand).toBeDefined();

    const entrypoint = runCommand!.split('node')[1].trim().replace(/^\.\//, '');

    expect(existsSync(entrypoint)).toBe(true);
  });
});
