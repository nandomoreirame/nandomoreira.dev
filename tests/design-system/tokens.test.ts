import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

const COLOR_TOKENS = {
  '--color-background': '#0a0a0a',
  '--color-surface': '#171717',
  '--color-surface-elevated': '#262626',
  '--color-border': '#262626',
  '--color-border-strong': '#404040',
  '--color-foreground': '#fafafa',
  '--color-muted-foreground': '#a3a3a3',
  '--color-primary': '#f59e0b',
  '--color-primary-foreground': '#0a0a0a',
  '--color-success': '#22c55e',
  '--color-warning': '#eab308',
  '--color-destructive': '#ef4444',
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

  it('declares only two motion durations, per DESIGN-GUIDELINES', () => {
    const durations = css.match(/--duration-[a-z]+:/g) ?? [];
    expect(durations).toHaveLength(2);
  });

  it('ships a single dark theme, with no light-mode override', () => {
    expect(css).not.toContain('prefers-color-scheme');
    expect(css).not.toContain('data-theme');
  });
});
