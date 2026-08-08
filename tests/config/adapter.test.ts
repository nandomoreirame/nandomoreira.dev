import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('astro node adapter (standalone)', () => {
  it('emits a standalone server entrypoint after build', () => {
    expect(existsSync('dist/server/entry.mjs')).toBe(true);
  });
});
