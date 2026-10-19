import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Tailwind 4 resolves `max-w-<name>` against `--spacing-<name>` before the
 * default container scale. This theme defines spacing xs..3xl, so `max-w-2xl`
 * is 4rem, not 42rem: on 2026-10-18 it squeezed the sales landing headings to
 * one word per line. Widths use the --container-* tokens of global.css.
 */
const COLLIDING = /\bmax-w-(xs|sm|md|lg|xl|2xl|3xl)\b/;

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap(entry => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? files(path) : /\.(astro|ts|tsx|css)$/.test(entry) ? [path] : [];
  });

describe('max-width utilities that collide with the spacing scale', () => {
  it('are never used in src/', () => {
    const offenders = files('src').filter(file => COLLIDING.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('proves the gate can fail', () => {
    expect(COLLIDING.test('class="max-w-2xl"')).toBe(true);
    expect(COLLIDING.test('class="max-w-page"')).toBe(false);
  });
});
