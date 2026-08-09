import { readdirSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Requires `npm run build`. Runs from vitest.build.config.ts, never from
// `npm test`: `dist/` is gitignored, so a fresh clone has nothing to assert on.

const ASSETS = 'dist/client/_astro';
const IMAGE = /\.(png|jpe?g|gif|webp|avif)$/i;

/** `<name>.<hash>.png` is the untouched source; `<name>.<hash>_<hash2>.webp` is its variant. */
const withVariant = (files: readonly string[]) => {
  const names = new Set(files);

  return files.filter((file) => {
    const base = file.replace(IMAGE, '');
    return [...names].some((other) => other !== file && other.startsWith(`${base}_`));
  });
};

describe('build assets', () => {
  const files = readdirSync(ASSETS).filter((f) => IMAGE.test(f));

  it('emits images at all', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('ships no source image that was already optimised into a variant', () => {
    // Astro emits the untouched source next to the variant it serves. Nothing
    // requests it, so it is pure weight in the deploy artifact: 18 MB of 31 MB
    // when this gate was written.
    const leftovers = withVariant(files);
    const megabytes = (
      leftovers.reduce((total, f) => total + statSync(`${ASSETS}/${f}`).size, 0) /
      1024 /
      1024
    ).toFixed(1);

    expect(leftovers, `${leftovers.length} unserved originals, ${megabytes} MB`).toEqual([]);
  });
});
