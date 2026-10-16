import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

// The lightbox sizes its <img> with width:auto inside a shrink-to-fit popover.
// An SVG with only a viewBox has no intrinsic size there and collapses to a dot
// (seen on the ETL diagrams, 2026-10-15). width and height on the root give it one.
describe('post SVG images', () => {
  it('declare an intrinsic width and height on the root element', async () => {
    const missing: string[] = [];
    for await (const file of glob('src/assets/posts/**/*.svg')) {
      const root = readFileSync(file, 'utf8').match(/<svg\b[^>]*>/)?.[0] ?? '';
      if (!/\swidth="\d+"/.test(root) || !/\sheight="\d+"/.test(root)) missing.push(file);
    }
    expect(missing).toEqual([]);
  });
});
