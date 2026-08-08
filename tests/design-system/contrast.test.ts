import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

const BACKGROUND = '#0a0a0a';
const SURFACE = '#171717';

describe('contrastRatio', () => {
  it('matches the WCAG 2.1 reference for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#f59e0b', BACKGROUND)).toBeCloseTo(
      contrastRatio(BACKGROUND, '#f59e0b'),
      5,
    );
  });
});

describe('palette contrast, as declared in DESIGN-GUIDELINES.md', () => {
  const PASSING: Array<[string, string, string, number]> = [
    ['foreground', '#fafafa', BACKGROUND, 18.97],
    ['muted-foreground', '#a3a3a3', BACKGROUND, 7.85],
    ['muted-foreground on surface', '#a3a3a3', SURFACE, 7.11],
    ['primary', '#f59e0b', BACKGROUND, 9.22],
    ['primary on surface', '#f59e0b', SURFACE, 8.35],
    ['success', '#22c55e', BACKGROUND, 8.69],
    ['destructive', '#ef4444', BACKGROUND, 5.26],
  ];

  it.each(PASSING)('%s hits the documented ratio', (_name, fg, bg, expected) => {
    expect(contrastRatio(fg, bg)).toBeCloseTo(expected, 1);
  });

  it.each(PASSING)('%s clears WCAG AA for body text', (_name, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('confirms border fails AA, which is why it can never delimit a target alone', () => {
    const ratio = contrastRatio('#262626', BACKGROUND);
    expect(ratio).toBeCloseTo(1.31, 1);
    expect(ratio).toBeLessThan(3);
  });
});
