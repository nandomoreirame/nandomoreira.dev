import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('/chat redirects home', () => {
  it('keeps the old site route working with a permanent redirect', () => {
    const source = readFileSync('astro.config.mjs', 'utf8');

    expect(source).toMatch(/['"]\/chat['"]\s*:\s*['"]\/['"]/);
  });
});
