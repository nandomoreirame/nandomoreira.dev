import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const TOKEN_FILE = 'src/styles/global.css';
/**
 * Mail clients read no CSS variables, so the e-mail templates need literal
 * colors. They live in one file, held to global.css by tests/emails/tokens.test.ts.
 */
const EMAIL_TOKEN_FILE = 'src/emails/_shared/tokens.ts';
const TOKEN_FILES = new Set([TOKEN_FILE, EMAIL_TOKEN_FILE]);

/**
 * Allowed Tailwind arbitrary values:
 * - max-w-[Nch]: relative unit outside the spacing scale
 * - transition-[prop,prop,...]: property lists (not values), letters/hyphens/commas only
 */
/**
 * Allowed Tailwind arbitrary values:
 * - max-w-[Nch]: relative unit outside the spacing scale
 * - transition-[prop,...]: property lists (not values)
 * - text-[3.75rem]: desktop display size from DESIGN-GUIDELINES (single use)
 */
const ALLOWED_ARBITRARY =
  /\bmax-w-\[\d+ch\]|\btransition-\[[a-z]+(?:-[a-z]+)*(?:,[a-z]+(?:-[a-z]+)*)*\]|\btext-\[3\.75rem\]/g;

const collectSources = async (): Promise<string[]> => {
  const files: string[] = [];
  // .tsx: the React Email templates (src/emails) are held to the same scale.
  for await (const entry of glob('src/**/*.{astro,css,ts,tsx}')) {
    if (!TOKEN_FILES.has(relative('.', entry))) files.push(entry);
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

  it('scans the e-mail templates and exempts only their token file', async () => {
    const sources = await collectSources();
    expect(sources.some(file => file.endsWith('.tsx'))).toBe(true);
    expect(sources).not.toContain(EMAIL_TOKEN_FILE);
  });

  it('never uses a Tailwind arbitrary value, which bypasses the scale', async () => {
    const offenders: string[] = [];

    for (const file of await collectSources()) {
      const source = readFileSync(file, 'utf8');
      const withoutAllowed = source.replace(ALLOWED_ARBITRARY, '');
      const matches =
        withoutAllowed.match(/\b(p|m|gap|w|h|text|rounded|duration|ease|transition)[a-z]*-\[[^\]]+\]/g) ?? [];
      if (matches.length > 0) offenders.push(`${file}: ${matches.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });
});
