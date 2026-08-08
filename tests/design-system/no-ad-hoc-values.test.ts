import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const TOKEN_FILE = 'src/styles/global.css';

/** Allowed Tailwind arbitrary values (relative units outside the spacing scale). */
const ALLOWED_ARBITRARY = /\bmax-w-\[\d+ch\]/g;

const collectSources = async (): Promise<string[]> => {
  const files: string[] = [];
  for await (const entry of glob('src/**/*.{astro,css,ts}')) {
    if (relative('.', entry) !== TOKEN_FILE) files.push(entry);
  }
  return files;
};

describe('no ad-hoc values outside the scale', () => {
  it('never hardcodes a hex color outside the token file', async () => {
    const offenders: string[] = [];

    for (const file of await collectSources()) {
      const source = readFileSync(file, 'utf8');
      const matches = source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });

  it('never uses a Tailwind arbitrary value, which bypasses the scale', async () => {
    const offenders: string[] = [];

    for (const file of await collectSources()) {
      const source = readFileSync(file, 'utf8');
      const withoutAllowed = source.replace(ALLOWED_ARBITRARY, '');
      const matches =
        withoutAllowed.match(/\b(p|m|gap|w|h|text|rounded)[a-z]*-\[[^\]]+\]/g) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });
});
