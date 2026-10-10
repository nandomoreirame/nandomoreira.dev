import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { gists, type Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const FRAMES = [
  { width: 160, height: 90 },
  { width: 210, height: 90 },
];

type Bar = Extract<Shape, { kind: 'bar' }>;
const bars = (shapes: Shape[]) => shapes.filter((shape): shape is Bar => shape.kind === 'bar');
// Language pills close every row on the same right edge.
const pillsOf = (shapes: Shape[], width: number) =>
  bars(shapes).filter((bar) => bar.h >= 3 && Math.abs(bar.x + bar.w - width * 0.92) < 0.01);

describe('gists motif', () => {
  it.each(FRAMES)('draws four to six list rows, each closed by a language pill ($width x $height)', (frame) => {
    for (let i = 0; i < 20; i += 1) {
      const shapes = gists(createRandom(hashString(`gists:${i}`)), frame);
      const pills = pillsOf(shapes, frame.width);

      expect(pills.length).toBeGreaterThanOrEqual(4);
      expect(pills.length).toBeLessThanOrEqual(6);
      for (const shape of bars(shapes)) {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.x + shape.w).toBeLessThanOrEqual(frame.width);
        expect(shape.y + shape.h).toBeLessThanOrEqual(frame.height);
      }
    }
  });

  it('lights exactly one row title, the selected gist', () => {
    for (let i = 0; i < 20; i += 1) {
      const shapes = gists(createRandom(hashString(`gists:hero:${i}`)), FRAMES[0]);
      const strongest = shapes.filter((shape) => shape.weight === 1);

      expect(strongest).toHaveLength(1);
      expect(strongest[0].kind).toBe('bar');
    }
  });

  it('is what Gistbar, a gist search panel, declares', () => {
    expect(readFileSync('src/content/projects/noctalia-gistbar.md', 'utf8')).toMatch(/^art: gists$/m);
  });
});
