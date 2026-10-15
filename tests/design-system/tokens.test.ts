import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

// Exquisitus dark ramp, converted from OKLCH to sRGB hex. Surfaces stay
// near-neutral; the warmth lives in the ink and the honey accent.
const COLOR_TOKENS = {
  '--color-background': '#110f0d',
  '--color-surface': '#191714',
  '--color-surface-elevated': '#211f1c',
  '--color-border': '#332f2c',
  '--color-border-strong': '#6c6863',
  '--color-foreground': '#efebe2',
  '--color-muted-foreground': '#a29e96',
  '--color-primary': '#f0c36f',
  '--color-primary-foreground': '#110f0d',
  '--color-success': '#a9ddb2',
  '--color-warning': '#facf9e',
  '--color-destructive': '#ffb7b0',
};

const SPACING_TOKENS = {
  '--spacing-xs': '0.25rem',
  '--spacing-sm': '0.5rem',
  '--spacing-md': '1rem',
  '--spacing-lg': '1.5rem',
  '--spacing-xl': '2.5rem',
  '--spacing-2xl': '4rem',
  '--spacing-3xl': '6rem',
};

const RADIUS_TOKENS = {
  '--radius-sm': '0.25rem',
  '--radius-md': '0.5rem',
  '--radius-lg': '0.75rem',
  '--radius-full': '9999px',
};

const MOTION_TOKENS = {
  '--duration-fast': '150ms',
  '--duration-base': '250ms',
  '--duration-slow': '500ms',
};

describe('design tokens', () => {
  it.each(Object.entries(COLOR_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(SPACING_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(RADIUS_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it.each(Object.entries(MOTION_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });

  it('declares only three motion durations, per DESIGN-GUIDELINES', () => {
    const durations = css.match(/--duration-[a-z]+:/g) ?? [];
    expect(durations).toHaveLength(3);
  });

  it('ships a single dark theme, with no light-mode override', () => {
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).not.toContain('data-theme');
  });
});

const NEW_TOKENS = {
  '--tracking-eyebrow': '0.2em',
  '--text-micro': '0.6875rem',
  // The reference theme caps every surface at max-w-3xl (48rem). The original
  // 1200px produced a measure 1.62x wider than the reference, which is what
  // made the restyle read as a different layout rather than the same one.
  // Widened to 62.5rem (1000px) on 2026-10-08 so the portfolio rows fit art
  // and text side by side (generative-case-art amendment).
  '--container-page': '62.5rem',
};

describe('tokens introduced by the restyle', () => {
  it.each(Object.entries(NEW_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });
});
