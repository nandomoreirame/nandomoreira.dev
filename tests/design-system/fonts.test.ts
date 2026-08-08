import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

const FONT_FILES = [
  'public/fonts/inter-latin-400.woff2',
  'public/fonts/inter-latin-500.woff2',
  'public/fonts/inter-latin-600.woff2',
  'public/fonts/jetbrains-mono-latin-400.woff2',
  'public/fonts/jetbrains-mono-latin-500.woff2',
];

describe('fonts', () => {
  it.each(FONT_FILES)('ships %s from our own origin', (file) => {
    expect(existsSync(file)).toBe(true);
  });

  it('never requests a font from a third-party host', () => {
    expect(css).not.toContain('fonts.googleapis.com');
    expect(css).not.toContain('fonts.gstatic.com');
    expect(css).not.toMatch(/@import\s+url\(\s*["']?https?:/);
  });

  it('swaps rather than blocking, so text is never invisible while loading', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(faces.length).toBe(FONT_FILES.length);
    for (const face of faces) {
      expect(face).toContain('font-display: swap');
    }
  });
});
