import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('home route', () => {
  it('exists so the deployed backend answers 200 on /', () => {
    expect(existsSync('src/pages/index.astro')).toBe(true);
  });
});
