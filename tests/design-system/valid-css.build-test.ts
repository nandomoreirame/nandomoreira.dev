import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CLIENT_ROOT = 'dist/client';

/** Collect every .css file under dist/client (recursive). */
const collectStylesheets = (dir: string): string[] => {
  if (!existsSync(dir)) return [];

  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectStylesheets(path));
    else if (entry.name.endsWith('.css')) found.push(path);
  }
  return found;
};

/**
 * Match declarations whose *value* is a bare custom-property name
 * (e.g. `transition-duration:--duration-fast`), which is invalid CSS.
 * Allows `var(--token)` and custom-property *definitions* (`--token: 1s`).
 */
const BARE_CUSTOM_PROPERTY_VALUE = /:\s*--[a-zA-Z0-9_-]+\b(?!\s*\()/g;

describe('valid CSS in the build output', () => {
  it('requires a build to have run', () => {
    expect(existsSync('dist')).toBe(true);
  });

  it('ships at least one stylesheet under dist/client', () => {
    const sheets = collectStylesheets(CLIENT_ROOT);
    expect(sheets.length, 'expected CSS under dist/client after a build').toBeGreaterThan(0);
  });

  it('never emits a declaration whose value is a bare custom-property name', () => {
    const sheets = collectStylesheets(CLIENT_ROOT);
    expect(sheets.length).toBeGreaterThan(0);

    const offenders: string[] = [];
    for (const file of sheets) {
      const css = readFileSync(file, 'utf8');
      const matches = css.match(BARE_CUSTOM_PROPERTY_VALUE) ?? [];
      if (matches.length > 0) {
        offenders.push(`${file}: ${[...new Set(matches)].join(', ')}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
