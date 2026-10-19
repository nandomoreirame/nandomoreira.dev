import type { Block } from '../../content/blocks';
import type { ArtMotif } from '../../content/motifs';
import {
  ascent,
  calendar,
  chart,
  flow,
  gantt,
  map,
  mosaic,
  orbit,
  panels,
  play,
  storefront,
  terminal,
  timeline,
  timer,
  usage,
  gists,
  chat,
  wave,
  windows,
  wireframe,
  type Motif,
  type Shape,
} from './motifs';
import { createRandom, hashString } from './random';

export type ArtAspect = 'card' | 'banner';

const FRAMES: Record<ArtAspect, { width: number; height: number }> = {
  card: { width: 160, height: 90 },
  banner: { width: 210, height: 90 },
};

/** Keeps the listing HTML small: fifteen cards render fifteen SVGs (REQ-015). */
export const ELEMENT_BUDGET: Record<ArtAspect, number> = { card: 200, banner: 300 };

/** Exhaustive by type: a motif listed in ART_MOTIFS without a drawer fails the type-check. */
export const MOTIF_DRAWERS: Record<ArtMotif, Motif> = {
  orbit,
  wave,
  terminal,
  flow,
  chart,
  storefront,
  map,
  wireframe,
  play,
  panels,
  windows,
  timer,
  ascent,
  mosaic,
  timeline,
  gantt,
  calendar,
  usage,
  gists,
  chat,
};

/** Fallback when a case declares no `art`: one motif per block. */
export const BLOCK_MOTIF: Record<Block, ArtMotif> = {
  'ai-tooling': 'orbit',
  'ai-product': 'wave',
  'systems-cli': 'terminal',
  professional: 'flow',
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

/**
 * A case brings its block, which also supplies the motif when it declares
 * none (REQ-003). A post has no block, so it must name its motif.
 */
export type ArtInput = { slug: string; aspect: ArtAspect } & (
  { block: Block; art?: ArtMotif } | { block?: undefined; art: ArtMotif }
);

/**
 * Pure: same input, same markup (REQ-001, REQ-002). Colours are classes bound
 * to tokens in global.css, never attributes, so the hex gate holds (REQ-004).
 */
export const generateArt = ({ slug, block, art, aspect }: ArtInput): string => {
  const frame = FRAMES[aspect];
  const motif = art ?? BLOCK_MOTIF[block!];
  // Cases keep their block in the seed so their drawings never change.
  const random = createRandom(hashString(`${block ?? 'post'}:${slug}`));
  const shapes = MOTIF_DRAWERS[motif](random, frame).slice(0, ELEMENT_BUDGET[aspect]);
  const heroes = heroIndexes(shapes);

  const layers = ([0, 1, 2] as const)
    .map(layer => {
      const body = shapes
        .map((shape, index) => ({ shape, index }))
        .filter(({ shape }) => shape.layer === layer)
        .map(({ shape, index }) => element(shape, toneOf(shape, heroes.has(index))))
        .join('');
      return `<g class="art-layer" style="--depth:${layer + 1}"><g class="art-drift">${body}</g></g>`;
    })
    .join('');

  return `<svg class="art" viewBox="0 0 ${frame.width} ${frame.height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false" data-motif="${motif}">${layers}</svg>`;
};
