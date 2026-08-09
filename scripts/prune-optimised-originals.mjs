#!/usr/bin/env node
/**
 * Removes, from the build output, every source image that Astro already
 * optimised into a served variant.
 *
 * Astro's image pipeline emits both: `<name>.<hash>.png` is the untouched
 * source and `<name>.<hash>_<hash2>.webp` is what the markup actually
 * references. Nothing requests the source, so it is pure weight in the deploy
 * artifact. Measured when this was written: 67 files, 18.7 MB out of 31 MB.
 *
 * Safety: a file is only removed when a sibling starting with its own basename
 * plus `_` exists, which is the variant. If Astro ever changes that naming, no
 * pair matches and nothing is deleted. The failure mode is keeping dead weight,
 * never dropping an image the site serves. `scripts/verify-local-server.sh`
 * closes the loop by requesting every image the routes reference.
 *
 * Runs from `postbuild`, so it also applies to the App Hosting build.
 */

import { readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ASSETS = 'dist/client/_astro';
const IMAGE = /\.(png|jpe?g|gif|webp|avif)$/i;

let files;
try {
  files = readdirSync(ASSETS).filter((file) => IMAGE.test(file));
} catch {
  // No build output (or no images in it) is not an error worth failing on.
  console.log('prune-optimised-originals: nothing to do, no build assets found');
  process.exit(0);
}

const names = new Set(files);

const originals = files.filter((file) => {
  const base = file.replace(IMAGE, '');
  for (const other of names) {
    if (other !== file && other.startsWith(`${base}_`)) return true;
  }
  return false;
});

let freed = 0;
for (const file of originals) {
  const path = join(ASSETS, file);
  freed += statSync(path).size;
  rmSync(path);
}

const megabytes = (freed / 1024 / 1024).toFixed(1);
console.log(
  `prune-optimised-originals: removed ${originals.length} optimised source images, freed ${megabytes} MB`,
);
console.log('PRUNE PASSED');
