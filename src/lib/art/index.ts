import type { Block } from '../../content/blocks';
import { flow, orbit, terminal, wave, type Motif, type Shape } from './motifs';
import { createRandom, hashString } from './random';

export type ArtAspect = 'card' | 'banner';

const FRAMES: Record<ArtAspect, { width: number; height: number }> = {
  card: { width: 160, height: 90 },
  banner: { width: 210, height: 90 },
};

/** Keeps the listing HTML small: fifteen cards render fifteen SVGs (REQ-015). */
export const ELEMENT_BUDGET: Record<ArtAspect, number> = { card: 200, banner: 300 };

/** Exhaustive by type: a new block without a motif fails the type-check. */
const MOTIFS: Record<Block, { name: string; draw: Motif }> = {
  'ai-tooling': { name: 'orbit', draw: orbit },
  'ai-product': { name: 'wave', draw: wave },
  'systems-cli': { name: 'terminal', draw: terminal },
  professional: { name: 'flow', draw: flow },
};

/** Amber on 10% to 20% of the elements: the signal, never the noise (REQ-004). */
export const heroCount = (total: number): number =>
  Math.min(Math.floor(total * 0.2), Math.max(Math.ceil(total * 0.1), Math.round(total * 0.15)));

export const heroIndexes = (shapes: Shape[]): Set<number> =>
  new Set(
    shapes
      .map((shape, index) => ({ weight: shape.weight, index }))
      .filter(({ weight }) => weight > 0)
      .sort((a, b) => b.weight - a.weight || a.index - b.index)
      .slice(0, heroCount(shapes.length))
      .map(({ index }) => index),
  );

const n = (value: number): string => String(Number(value.toFixed(2)));

const toneOf = (shape: Shape, hero: boolean): string => {
  if (hero) return 'art-hero';
  return shape.layer === 0 ? 'art-faint' : 'art-base';
};

const element = (shape: Shape, tone: string): string => {
  switch (shape.kind) {
    case 'dot':
      return `<circle class="${tone}" cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.r)}"/>`;
    case 'ring':
      return `<circle class="${tone} art-ring" cx="${n(shape.x)}" cy="${n(shape.y)}" r="${n(shape.r)}"/>`;
    case 'line':
      return `<line class="${tone} art-line" x1="${n(shape.x1)}" y1="${n(shape.y1)}" x2="${n(shape.x2)}" y2="${n(shape.y2)}"/>`;
    case 'bar':
      return `<rect class="${tone}" x="${n(shape.x)}" y="${n(shape.y)}" width="${n(shape.w)}" height="${n(shape.h)}" rx="0.6"/>`;
  }
};

export interface ArtInput {
  slug: string;
  block: Block;
  aspect: ArtAspect;
}

/**
 * Pure: same input, same markup (REQ-001, REQ-002). Colours are classes bound
 * to tokens in global.css, never attributes, so the hex gate holds (REQ-004).
 */
export const generateArt = ({ slug, block, aspect }: ArtInput): string => {
  const frame = FRAMES[aspect];
  const motif = MOTIFS[block];
  const random = createRandom(hashString(`${block}:${slug}`));
  const shapes = motif.draw(random, frame).slice(0, ELEMENT_BUDGET[aspect]);
  const heroes = heroIndexes(shapes);

  const layers = ([0, 1, 2] as const)
    .map((layer) => {
      const body = shapes
        .map((shape, index) => ({ shape, index }))
        .filter(({ shape }) => shape.layer === layer)
        .map(({ shape, index }) => element(shape, toneOf(shape, heroes.has(index))))
        .join('');
      return `<g class="art-layer" style="--depth:${layer + 1}"><g class="art-drift">${body}</g></g>`;
    })
    .join('');

  return `<svg class="art" viewBox="0 0 ${frame.width} ${frame.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-motif="${motif.name}">${layers}</svg>`;
};
