import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

// Terminal Noir (Stitch, 2026-10-16): cold neutral surfaces and an amber accent.
// text-muted (#71717A, 4.07:1) and border-strong (#3F3F46, 1.88:1) from the
// Stitch file fail AA, so they were lightened instead of copied.
const COLOR_TOKENS = {
  '--color-background': '#0b0b0c',
  '--color-surface': '#121214',
  '--color-surface-elevated': '#18181b',
  '--color-border': '#222226',
  '--color-border-strong': '#6b6b74',
  '--color-foreground': '#f4f4f5',
  '--color-muted-foreground': '#a1a1aa',
  '--color-primary': '#f5a623',
  '--color-primary-foreground': '#0b0b0c',
  '--color-success': '#34d399',
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
  '--radius-md': '0.375rem',
  '--radius-lg': '0.5rem',
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
  // Lead paragraph under a hero or page title (Terminal Noir body-lead).
  '--text-lead': '1.125rem',
  // Since 2026-10-17 the content shares the header frame (Terminal Noir):
  // 69rem / 1104px, so the brand and the page column line up.
  '--container-page': '69rem',
  // Terminal Noir (2026-10-16): header and footer span a wider frame than the
  // content, 1104px as in the Stitch file. Same value as page since 2026-10-17.
  '--container-frame': '69rem',
  // Centred column for list sections: blog, portfolio and lab on the home,
  // and the blog index, as in the Stitch file (848px).
  '--container-list': '53rem',
  // Amber halo on the primary button hover, the only glow in the system.
  '--shadow-glow': '0 0 24px rgb(245 166 35 / 0.25)',
  // Soft drop under the sales hero's inner windows, the one shadow in the
  // system (Fernando, 2026-10-18): separates the stacked layers.
  '--shadow-window': '0 12px 32px rgb(0 0 0 / 0.45)',
};

describe('tokens introduced by the restyle', () => {
  it.each(Object.entries(NEW_TOKENS))('declares %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value}`);
  });
});
