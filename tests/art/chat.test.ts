import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { chat, type Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const FRAMES = [
  { width: 160, height: 90 },
  { width: 210, height: 90 },
];

type Line = Extract<Shape, { kind: 'line' }>;
type Bar = Extract<Shape, { kind: 'bar' }>;
// The coloured stripe on the left edge of a webhook embed: a vertical line.
const stripesOf = (shapes: Shape[]) =>
  shapes.filter((shape): shape is Line => shape.kind === 'line' && shape.x1 === shape.x2 && shape.y2 - shape.y1 > 8);

describe('chat motif', () => {
  it.each(FRAMES)('draws two or three embeds, each with its stripe, inside the frame ($width x $height)', frame => {
    for (let i = 0; i < 20; i += 1) {
      const shapes = chat(createRandom(hashString(`chat:${i}`)), frame);
      const stripes = stripesOf(shapes);

      expect(stripes.length).toBeGreaterThanOrEqual(2);
      expect(stripes.length).toBeLessThanOrEqual(3);
      for (const shape of shapes.filter((s): s is Bar => s.kind === 'bar')) {
        expect(shape.x).toBeGreaterThanOrEqual(0);
        expect(shape.x + shape.w).toBeLessThanOrEqual(frame.width);
        expect(shape.y + shape.h).toBeLessThanOrEqual(frame.height);
      }
      for (const stripe of stripes) {
        expect(stripe.y2).toBeLessThanOrEqual(frame.height);
      }
    }
  });

  it('lights exactly one embed title, the best match', () => {
    for (let i = 0; i < 20; i += 1) {
      const shapes = chat(createRandom(hashString(`chat:hero:${i}`)), FRAMES[0]);
      const strongest = shapes.filter(shape => shape.weight === 1);

      expect(strongest).toHaveLength(1);
      expect(strongest[0].kind).toBe('bar');
    }
  });

  it('is what the job-radar post, a Discord channel of jobs, declares', () => {
    expect(readFileSync('src/content/posts/job-radar-radar-de-vagas-em-python-puro.md', 'utf8')).toMatch(
      /^art: chat$/m,
    );
  });
});
