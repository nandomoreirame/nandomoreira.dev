import { describe, expect, it } from 'vitest';
import { BLOCKS } from '../../src/content/blocks';
import { ART_MOTIFS } from '../../src/content/motifs';
import {
  BLOCK_MOTIF,
  ELEMENT_BUDGET,
  MOTIF_DRAWERS,
  generateArt,
  heroCount,
  heroIndexes,
  type ArtAspect,
} from '../../src/lib/art';
import type { Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const ASPECTS: ArtAspect[] = ['card', 'banner'];
const FRAMES: Record<ArtAspect, { width: number; height: number }> = {
  card: { width: 160, height: 90 },
  banner: { width: 210, height: 90 },
};
const shapesOf = (svg: string) => svg.match(/<(circle|line|rect)\b/g) ?? [];
const heroesOf = (svg: string) => svg.match(/class="art-hero\b/g) ?? [];

// Every motif a case can declare, in both aspects: a new motif inherits every
// guarantee below without anyone remembering to list it.
const cases = ART_MOTIFS.flatMap(art => ASPECTS.map(aspect => ({ art, aspect })));
const draw = (art: (typeof ART_MOTIFS)[number], aspect: ArtAspect, slug = 'sample') =>
  generateArt({ slug, block: 'professional', art, aspect });

describe('generateArt', () => {
  it('draws a post, which has no block, from the motif it declares', () => {
    const post = { slug: 'um-post', art: 'orbit', aspect: 'banner' } as const;
    const svg = generateArt(post);

    expect(svg).toContain('data-motif="orbit"');
    expect(svg).toBe(generateArt(post));
    expect(svg).not.toBe(generateArt({ ...post, slug: 'outro-post' }));
  });

  it('draws the same markup for the same input, byte for byte', () => {
    const input = { slug: 'forja', block: 'ai-tooling', art: 'panels', aspect: 'card' } as const;
    expect(generateArt(input)).toBe(generateArt(input));
  });

  it('draws the motif the case declares', () => {
    for (const art of ART_MOTIFS) {
      expect(draw(art, 'card')).toContain(`data-motif="${art}"`);
    }
  });

  it('falls back to the block motif when the case declares none', () => {
    const motifs = BLOCKS.map(
      block => generateArt({ slug: 'x', block, aspect: 'card' }).match(/data-motif="([a-z]+)"/)?.[1],
    );
    expect(motifs).toEqual(['orbit', 'wave', 'terminal', 'flow']);
    expect(BLOCKS.map(block => BLOCK_MOTIF[block])).toEqual(motifs);
  });

  it('varies the drawing with the slug inside the same motif', () => {
    expect(draw('wireframe', 'card', 'abracce')).not.toBe(draw('wireframe', 'card', 'sudadhara'));
  });

  it('draws tiling as two page windows side by side, filling the frame', () => {
    const frame = { width: 160, height: 90 };
    const shapes = MOTIF_DRAWERS.tiling(createRandom(hashString('tiling')), frame);
    const edges = shapes
      .filter((shape): shape is Extract<Shape, { kind: 'line' }> => shape.kind === 'line')
      .filter(line => line.x1 === line.x2 && Math.abs(line.y2 - line.y1) > frame.height * 0.8)
      .map(line => line.x1)
      .sort((a, b) => a - b);
    expect(edges).toHaveLength(4);
    const [leftStart, leftEnd, rightStart, rightEnd] = edges as [number, number, number, number];
    expect(leftEnd).toBeLessThan(rightStart);
    expect(leftEnd - leftStart).toBeCloseTo(rightEnd - rightStart, 5);
  });

  it('draws gitflow as five branch lanes joined by branch and merge diagonals, tags on top', () => {
    const frame = { width: 160, height: 90 };
    const shapes = MOTIF_DRAWERS.gitflow(createRandom(hashString('gitflow')), frame);
    const lines = shapes.filter((shape): shape is Extract<Shape, { kind: 'line' }> => shape.kind === 'line');
    const lanes = lines
      .filter(line => line.y1 === line.y2 && Math.abs(line.x2 - line.x1) > frame.width * 0.8)
      .map(line => line.y1);
    expect(new Set(lanes).size).toBe(5);

    const diagonals = lines.filter(line => line.y1 !== line.y2);
    expect(diagonals.length).toBeGreaterThan(3);
    for (const line of diagonals) {
      expect(lanes).toContain(line.y1);
      expect(lanes).toContain(line.y2);
    }
    for (const dot of shapes.filter(shape => shape.kind === 'dot')) {
      expect(lanes).toContain((dot as Extract<Shape, { kind: 'dot' }>).y);
    }
    const top = Math.min(...lanes);
    expect(shapes.some(shape => shape.kind === 'bar' && shape.y < top)).toBe(true);
  });

  it('draws watcher as a polled on/off signal that acts only on its transitions', () => {
    const frame = { width: 160, height: 90 };
    const shapes = MOTIF_DRAWERS.watcher(createRandom(hashString('watcher')), frame);
    const lines = shapes.filter((shape): shape is Extract<Shape, { kind: 'line' }> => shape.kind === 'line');
    const signal = lines.filter(line => line.layer === 2);
    // the state is a square wave: only horizontal and vertical segments, on two levels
    for (const line of signal) expect(line.x1 === line.x2 || line.y1 === line.y2).toBe(true);
    const levels = new Set(signal.filter(line => line.y1 === line.y2).map(line => line.y1));
    expect(levels.size).toBe(2);
    const edges = signal.filter(line => line.x1 === line.x2);
    expect(edges.length).toBeGreaterThanOrEqual(2);

    // the loop polls at a fixed interval on the time axis
    const polls = shapes
      .filter((shape): shape is Extract<Shape, { kind: 'dot' }> => shape.kind === 'dot' && shape.layer === 1)
      .map(dot => dot.x)
      .sort((a, b) => a - b);
    expect(polls.length).toBeGreaterThan(10);
    const gaps = polls.slice(1).map((x, i) => x - polls[i]!);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0]!, 5);

    // one action mark per transition, at the transition
    const actions = shapes.filter((shape): shape is Extract<Shape, { kind: 'bar' }> => shape.kind === 'bar');
    const round = (x: number) => Math.round(x * 1000) / 1000;
    expect(actions.map(bar => round(bar.x + bar.w / 2)).sort((a, b) => a - b)).toEqual(
      edges.map(line => round(line.x1)).sort((a, b) => a - b),
    );
  });

  it('draws symlinks as repo files on the left, each linked to exactly one home target on the right', () => {
    const frame = { width: 160, height: 90 };
    const shapes = MOTIF_DRAWERS.symlinks(createRandom(hashString('symlinks')), frame);
    const sources = shapes.filter((shape): shape is Extract<Shape, { kind: 'dot' }> => shape.kind === 'dot' && shape.layer === 1);
    const targets = shapes.filter((shape): shape is Extract<Shape, { kind: 'ring' }> => shape.kind === 'ring');
    const links = shapes.filter((shape): shape is Extract<Shape, { kind: 'line' }> => shape.kind === 'line');

    expect(sources.length).toBeGreaterThanOrEqual(5);
    expect(targets.length).toBe(sources.length);
    const left = Math.max(...sources.map(dot => dot.x));
    const right = Math.min(...targets.map(ring => ring.x));
    expect(left).toBeLessThan(frame.width * 0.4);
    expect(right).toBeGreaterThan(frame.width * 0.6);

    const key = (x: number, y: number) => `${Math.round(x * 1000)},${Math.round(y * 1000)}`;
    const sourceKeys = new Set(sources.map(dot => key(dot.x, dot.y)));
    const targetKeys = targets.map(ring => key(ring.x, ring.y));
    expect(links.length).toBe(sources.length);
    for (const line of links) {
      expect(sourceKeys.has(key(line.x1, line.y1))).toBe(true);
      expect(targetKeys).toContain(key(line.x2, line.y2));
    }
    // one link per target: no home path is linked twice
    expect(new Set(links.map(line => key(line.x2, line.y2))).size).toBe(targets.length);
  });

  it('draws suite as rows of test cases sharing one grid, the newest case of each row weighing most', () => {
    const frame = { width: 160, height: 90 };
    const shapes = MOTIF_DRAWERS.suite(createRandom(hashString('suite')), frame);
    const cases = shapes.filter((shape): shape is Extract<Shape, { kind: 'bar' }> => shape.kind === 'bar');

    const rows = new Set(cases.map(bar => bar.y));
    expect(rows.size).toBeGreaterThanOrEqual(5);
    expect(new Set(cases.map(bar => bar.w)).size).toBe(1);
    // every row starts at the same column and its cases sit on a fixed pitch
    const starts = [...rows].map(y => Math.min(...cases.filter(bar => bar.y === y).map(bar => bar.x)));
    expect(new Set(starts.map(x => Math.round(x * 1000))).size).toBe(1);
    const pitch = (cases.filter(bar => bar.y === [...rows][0]).map(bar => bar.x).sort((a, b) => a - b)[1] ?? 0) - starts[0]!;
    for (const bar of cases) {
      const steps = (bar.x - starts[0]!) / pitch;
      expect(Math.abs(steps - Math.round(steps))).toBeLessThan(1e-6);
    }
    // cases are appended to the right, so weight (amber) grows with x inside each row
    for (const y of rows) {
      const row = cases.filter(bar => bar.y === y).sort((a, b) => a.x - b.x);
      for (let i = 1; i < row.length; i += 1) expect(row[i]!.weight).toBeGreaterThan(row[i - 1]!.weight);
    }
  });

  it('draws every motif differently from the others', () => {
    const drawings = ART_MOTIFS.map(art => draw(art, 'card').replace(/data-motif="[a-z]+"/, ''));
    expect(new Set(drawings).size).toBe(ART_MOTIFS.length);
  });

  it.each(cases)(
    'colours $art/$aspect only through classes, never hex or presentation attributes',
    ({ art, aspect }) => {
      const svg = draw(art, aspect);
      expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(svg).not.toMatch(/\s(fill|stroke)="/);
    },
  );

  it.each(cases)('keeps amber on 10% to 20% of the $art/$aspect elements', ({ art, aspect }) => {
    const svg = draw(art, aspect);
    const ratio = heroesOf(svg).length / shapesOf(svg).length;
    expect(ratio).toBeGreaterThanOrEqual(0.1);
    expect(ratio).toBeLessThanOrEqual(0.2);
  });

  it.each(cases)('stays under the element budget for $art/$aspect', ({ art, aspect }) => {
    const svg = draw(art, aspect);
    expect(shapesOf(svg).length).toBeLessThanOrEqual(ELEMENT_BUDGET[aspect]);
    expect(shapesOf(svg).length).toBeGreaterThan(20);
  });

  it('is decorative, hidden from assistive technology and from the tab order', () => {
    const svg = generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' });
    expect(svg).toContain('aria-hidden="true"');
    expect(svg).toContain('focusable="false"');
  });

  it('frames the card in 16:9 and the banner in 21:9', () => {
    expect(generateArt({ slug: 'x', block: 'ai-product', aspect: 'card' })).toContain('viewBox="0 0 160 90"');
    expect(generateArt({ slug: 'x', block: 'ai-product', aspect: 'banner' })).toContain('viewBox="0 0 210 90"');
  });

  it('splits the drawing into three depth layers for the parallax', () => {
    const svg = generateArt({ slug: 'x', block: 'professional', aspect: 'card' });
    expect(svg.match(/style="--depth:\d"/g)).toHaveLength(3);
  });
});

describe('heroCount', () => {
  it.each([20, 37, 64, 150, 300])('stays between 10% and 20% of %i', total => {
    expect(heroCount(total)).toBeGreaterThanOrEqual(Math.ceil(total * 0.1));
    expect(heroCount(total)).toBeLessThanOrEqual(Math.floor(total * 0.2));
  });
});

describe('heroIndexes', () => {
  it('never selects a shape whose weight is zero or less', () => {
    const shapes: Shape[] = Array.from({ length: 20 }, (_, index) =>
      index < 2
        ? ({ kind: 'dot', x: index, y: 0, r: 1, layer: 2, weight: 1 - index * 0.2 } as Shape)
        : ({ kind: 'dot', x: index, y: 0, r: 1, layer: 0, weight: 0 } as Shape),
    );
    // heroCount(20) is 3; only two shapes have weight > 0, so zeros must stay out.
    expect(heroCount(shapes.length)).toBeGreaterThan(2);
    const heroes = heroIndexes(shapes);
    for (const index of heroes) {
      expect(shapes[index].weight).toBeGreaterThan(0);
    }
    expect(heroes.size).toBe(2);
  });
});

describe('motif hero signal', () => {
  it.each(cases)('gives $art/$aspect enough positive-weight shapes for the amber quota', ({ art, aspect }) => {
    const frame = FRAMES[aspect];
    for (let i = 0; i < 50; i += 1) {
      const shapes = MOTIF_DRAWERS[art](createRandom(hashString(`${art}:slug-${i}`)), frame).slice(
        0,
        ELEMENT_BUDGET[aspect],
      );
      const positive = shapes.filter(shape => shape.weight > 0).length;
      expect(positive).toBeGreaterThanOrEqual(heroCount(shapes.length));
    }
  });
});
