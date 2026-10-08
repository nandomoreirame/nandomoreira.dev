import { describe, expect, it } from 'vitest';
import { BLOCKS, type Block } from '../../src/content/blocks';
import {
  ELEMENT_BUDGET,
  generateArt,
  heroCount,
  heroIndexes,
  type ArtAspect,
} from '../../src/lib/art';
import { flow, orbit, terminal, wave, type Shape } from '../../src/lib/art/motifs';
import { createRandom, hashString } from '../../src/lib/art/random';

const ASPECTS: ArtAspect[] = ['card', 'banner'];
const FRAMES: Record<ArtAspect, { width: number; height: number }> = {
  card: { width: 160, height: 90 },
  banner: { width: 210, height: 90 },
};
const MOTIFS: Record<Block, (random: () => number, frame: { width: number; height: number }) => Shape[]> = {
  'ai-tooling': orbit,
  'ai-product': wave,
  'systems-cli': terminal,
  professional: flow,
};
const shapesOf = (svg: string) => svg.match(/<(circle|line|rect)\b/g) ?? [];
const heroesOf = (svg: string) => svg.match(/class="art-hero\b/g) ?? [];

const cases = BLOCKS.flatMap((block) => ASPECTS.map((aspect) => ({ block, aspect })));

describe('generateArt', () => {
  it('draws the same markup for the same input, byte for byte', () => {
    const input = { slug: 'forja', block: 'ai-tooling', aspect: 'card' } as const;
    expect(generateArt(input)).toBe(generateArt(input));
  });

  it('gives each block its own motif', () => {
    const motifs = BLOCKS.map(
      (block) => generateArt({ slug: 'x', block, aspect: 'card' }).match(/data-motif="([a-z]+)"/)?.[1],
    );
    expect(motifs).toEqual(['orbit', 'wave', 'terminal', 'flow']);
  });

  it('varies the drawing with the slug inside the same block', () => {
    const a = generateArt({ slug: 'forja', block: 'ai-tooling', aspect: 'card' });
    const b = generateArt({ slug: 'amnesia', block: 'ai-tooling', aspect: 'card' });
    expect(a).not.toBe(b);
  });

  it.each(cases)('colours $block/$aspect only through classes, never hex or presentation attributes', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
    expect(svg).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(svg).not.toMatch(/\s(fill|stroke)="/);
  });

  it.each(cases)('keeps amber on 10% to 20% of the $block/$aspect elements', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
    const ratio = heroesOf(svg).length / shapesOf(svg).length;
    expect(ratio).toBeGreaterThanOrEqual(0.1);
    expect(ratio).toBeLessThanOrEqual(0.2);
  });

  it.each(cases)('stays under the element budget for $block/$aspect', ({ block, aspect }) => {
    const svg = generateArt({ slug: 'sample', block, aspect });
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
  it.each([20, 37, 64, 150, 300])('stays between 10% and 20% of %i', (total) => {
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
  it.each(cases)(
    'gives $block/$aspect enough positive-weight shapes for the amber quota',
    ({ block, aspect }) => {
      const frame = FRAMES[aspect];
      const draw = MOTIFS[block];
      for (let i = 0; i < 50; i += 1) {
        const shapes = draw(createRandom(hashString(`${block}:slug-${i}`)), frame).slice(
          0,
          ELEMENT_BUDGET[aspect],
        );
        const positive = shapes.filter((shape) => shape.weight > 0).length;
        expect(positive).toBeGreaterThanOrEqual(heroCount(shapes.length));
      }
    },
  );
});
