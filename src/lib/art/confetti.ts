import { between, createRandom, hashString } from './random';

/**
 * The confetti that rains once on /releases for about four seconds, drawn on
 * the server from a seed and moved by CSS alone (global.css, "Confetti"), so it costs no client script
 * and stays out of the JavaScript exception list.
 */
export const CONFETTI_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-destructive)',
  'var(--color-foreground)',
] as const;

export interface ConfettiPiece {
  /** Start, in % of the viewport width. */
  x: number;
  /** Seconds before it starts to fall. */
  delay: number;
  /** Seconds of the fall. */
  duration: number;
  /** Sideways travel during the fall, in vw. */
  drift: number;
  /** Turns while falling. */
  spin: number;
  /** Width in px; the height is half of it. */
  size: number;
  color: (typeof CONFETTI_COLORS)[number];
}

const round = (value: number): number => Math.round(value * 100) / 100;

export const confettiPieces = (seed: string, count: number): ConfettiPiece[] => {
  const random = createRandom(hashString(`confetti:${seed}`));
  return Array.from({ length: count }, () => ({
    x: round(between(random, 0, 100)),
    // Pieces keep starting for four seconds, so the rain lasts that long.
    delay: round(between(random, 0, 4)),
    duration: round(between(random, 2.4, 3.6)),
    drift: round(between(random, -12, 12)),
    spin: round(between(random, -3, 3)),
    size: Math.round(between(random, 6, 12)),
    color: CONFETTI_COLORS[Math.floor(random() * CONFETTI_COLORS.length)]!,
  }));
};
