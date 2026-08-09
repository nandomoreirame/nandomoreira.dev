import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

// Exquisitus palette, converted from OKLCH to sRGB hex. Hex is kept as the
// authored form so this gate can parse it: the ratios below are the ones the
// browser actually renders, not an approximation of the OKLCH source.
//
// Read from the stylesheet, never copied into this file. Hardcoding the hexes
// made the gate decorative: a palette change in global.css kept every ratio
// green because the test was measuring colours the site no longer used.
const CSS = readFileSync('src/styles/global.css', 'utf8');

const token = (name: string): string => {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`).exec(CSS);
  if (!match) {
    throw new Error(`--color-${name} not found in global.css, or not authored as hex`);
  }
  return match[1]!;
};

const BACKGROUND = token('background');
const SURFACE = token('surface');

describe('contrastRatio', () => {
  it('matches the WCAG 2.1 reference for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio(token('primary'), BACKGROUND)).toBeCloseTo(
      contrastRatio(BACKGROUND, token('primary')),
      5,
    );
  });
});

describe('palette contrast, as declared in DESIGN-GUIDELINES.md', () => {
  const PASSING: Array<[string, string, string, number]> = [
    ['foreground', token('foreground'), BACKGROUND, 16.08],
    ['muted-foreground', token('muted-foreground'), BACKGROUND, 7.17],
    ['muted-foreground on surface', token('muted-foreground'), SURFACE, 6.7],
    ['primary', token('primary'), BACKGROUND, 11.6],
    ['primary on surface', token('primary'), SURFACE, 10.85],
    ['success', token('success'), BACKGROUND, 12.45],
    ['warning', token('warning'), BACKGROUND, 13.19],
    ['destructive', token('destructive'), BACKGROUND, 11.52],
  ];

  it.each(PASSING)('%s hits the documented ratio', (_name, fg, bg, expected) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(expected, 1);
  });

  it.each(PASSING)('%s clears WCAG AA for body text', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('reads primary-foreground against primary, since the CTA inverts them', () => {
    expect(contrastRatio(BACKGROUND, '#f0c36f')).toBeGreaterThanOrEqual(4.5);
  });

  it('confirms border still fails AA, so it can never delimit a target alone', () => {
    // Softened from the Exquisitus 1.91 back towards the original 1.31: the
    // dividers on header, section titles and footer read as rules, not as
    // structure. Still nowhere near 3:1, so the rule it protects is unchanged.
    const ratio = contrastRatio(token('border'), BACKGROUND);
    expect(ratio).toBeCloseTo(1.44, 1);
    expect(ratio).toBeLessThan(3);
  });

  it('clears 3:1 on border-strong, which does delimit interactive targets', () => {
    expect(contrastRatio(token('border-strong'), BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
});
