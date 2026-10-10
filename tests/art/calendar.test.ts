import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { calendar, type Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const FRAMES = [
  { width: 160, height: 90 },
  { width: 210, height: 90 },
];

// The month is drawn as a ruled grid: weightless lines on the back layer.
type Line = Extract<Shape, { kind: 'line' }>;
const gridOf = (shapes: Shape[]) => {
  const lines = shapes.filter((shape): shape is Line => shape.kind === 'line' && shape.layer === 0);
  return {
    lines,
    columns: lines.filter((line) => line.x1 === line.x2),
    rows: lines.filter((line) => line.y1 === line.y2),
  };
};

describe('calendar motif', () => {
  it.each(FRAMES)('rules a month of five weeks in seven columns ($width x $height)', (frame) => {
    for (let i = 0; i < 20; i += 1) {
      const { columns, rows } = gridOf(calendar(createRandom(hashString(`calendar:${i}`)), frame));

      expect(columns).toHaveLength(8);
      expect(rows).toHaveLength(6);
    }
  });

  it.each(FRAMES)('keeps the whole month inside the frame ($width x $height)', (frame) => {
    const { lines } = gridOf(calendar(createRandom(hashString('calendar:frame')), frame));

    for (const line of lines) {
      for (const x of [line.x1, line.x2]) expect(x).toBeGreaterThanOrEqual(0);
      for (const x of [line.x1, line.x2]) expect(x).toBeLessThanOrEqual(frame.width);
      for (const y of [line.y1, line.y2]) expect(y).toBeGreaterThanOrEqual(0);
      for (const y of [line.y1, line.y2]) expect(y).toBeLessThanOrEqual(frame.height);
    }
  });

  it('draws no filled day cells, which read as a heavy block', () => {
    const shapes = calendar(createRandom(hashString('calendar:cells')), FRAMES[0]);
    const big = shapes.filter((shape) => shape.kind === 'bar' && shape.w > 10 && shape.h > 6);
    expect(big).toHaveLength(0);
  });

  it('marks exactly one day as today, the strongest signal', () => {
    const shapes = calendar(createRandom(hashString('calendar:today')), FRAMES[0]);
    expect(shapes.filter((shape) => shape.weight === 1)).toHaveLength(1);
  });

  it('is what Daybar, a day planner with Google Calendar, declares', () => {
    const daybar = readFileSync('src/content/projects/noctalia-daybar.md', 'utf8');
    expect(daybar).toMatch(/^art: calendar$/m);
  });
});
