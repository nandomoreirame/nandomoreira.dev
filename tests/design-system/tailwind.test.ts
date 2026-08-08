import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tailwind setup', () => {
  it('loads tailwind through the vite plugin, not a config file', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toContain('@tailwindcss/vite');
  });

  it('keeps the theme in CSS, so there is a single source of truth', () => {
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toContain('@import "tailwindcss"');
    expect(css).toContain('@theme');
  });
});
