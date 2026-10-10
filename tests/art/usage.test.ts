import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { usage, type Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const FRAMES = [
  { width: 160, height: 90 },
  { width: 210, height: 90 },
];

type Bar = Extract<Shape, { kind: 'bar' }>;
const bars = (shapes: Shape[]) => shapes.filter((shape): shape is Bar => shape.kind === 'bar');
// A usage row is a long weightless track with a fill drawn over it from the same start.
const rowsOf = (shapes: Shape[]) => {
  const all = bars(shapes);
  const tracks = all.filter((bar) => bar.layer === 0 && bar.weight === 0 && bar.w > 40);
  return tracks.map((track) => ({
    track,
    fill: all.find((bar) => bar !== track && bar.layer === 2 && bar.x === track.x && bar.y === track.y),
  }));
};

describe('usage motif', () => {
  it.each(FRAMES)('draws three to five usage rows, each a track with a fill ($width x $height)', (frame) => {
    for (let i = 0; i < 20; i += 1) {
      const rows = rowsOf(usage(createRandom(hashString(`usage:${i}`)), frame));

      expect(rows.length).toBeGreaterThanOrEqual(3);
      expect(rows.length).toBeLessThanOrEqual(5);
      for (const { track, fill } of rows) {
        expect(fill).toBeDefined();
        expect(fill!.w).toBeLessThanOrEqual(track.w);
        expect(track.x + track.w).toBeLessThanOrEqual(frame.width);
        expect(track.y + track.h).toBeLessThanOrEqual(frame.height);
      }
    }
  });

  it('fills the most used row the most and makes it the strongest signal', () => {
    for (let i = 0; i < 20; i += 1) {
      const shapes = usage(createRandom(hashString(`usage:hero:${i}`)), FRAMES[0]);
      const fills = rowsOf(shapes).map((row) => row.fill!);
      const strongest = shapes.filter((shape) => shape.weight === 1);

      expect(strongest).toHaveLength(1);
      expect(fills).toContain(strongest[0]);
      expect(Math.max(...fills.map((fill) => fill.w))).toBe((strongest[0] as Bar).w);
    }
  });

  it('is what AI Bar, a plan usage meter, declares', () => {
    expect(readFileSync('src/content/projects/noctalia-aibar.md', 'utf8')).toMatch(/^art: usage$/m);
  });
});
