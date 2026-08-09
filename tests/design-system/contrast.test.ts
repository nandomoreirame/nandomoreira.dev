import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

// Exquisitus palette, converted from OKLCH to sRGB hex. Hex is kept as the
// authored form so this gate can parse it: the ratios below are the ones the
// browser actually renders, not an approximation of the OKLCH source.
const BACKGROUND = '#110f0d';
const SURFACE = '#191714';

describe('contrastRatio', () => {
  it('matches the WCAG 2.1 reference for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#f0c36f', BACKGROUND)).toBeCloseTo(
      contrastRatio(BACKGROUND, '#f0c36f'),
      5,
    );
  });
});

describe('palette contrast, as declared in DESIGN-GUIDELINES.md', () => {
  const PASSING: Array<[string, string, string, number]> = [
    ['foreground', '#efebe2', BACKGROUND, 16.08],
    ['muted-foreground', '#a29e96', BACKGROUND, 7.17],
    ['muted-foreground on surface', '#a29e96', SURFACE, 6.7],
    ['primary', '#f0c36f', BACKGROUND, 11.6],
    ['primary on surface', '#f0c36f', SURFACE, 10.85],
    ['success', '#a9ddb2', BACKGROUND, 12.45],
    ['warning', '#facf9e', BACKGROUND, 13.19],
    ['destructive', '#ffb7b0', BACKGROUND, 11.52],
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
    // The Exquisitus hairline lifts this from 1.31 to 1.91, which is more
    // visible but still short of 3:1. The rule it protects does not change.
    const ratio = contrastRatio('#45423e', BACKGROUND);
    expect(ratio).toBeCloseTo(1.91, 1);
    expect(ratio).toBeLessThan(3);
  });

  it('clears 3:1 on border-strong, which does delimit interactive targets', () => {
    expect(contrastRatio('#6c6863', BACKGROUND)).toBeGreaterThanOrEqual(3);
  });
});
