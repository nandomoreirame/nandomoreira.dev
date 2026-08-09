import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

// Exquisitus pairing: a humanist serif carries the reading surfaces, a humanist
// sans carries the register, and JetBrains Mono carries the machine voice.
const FONT_FILES = [
  'public/fonts/literata-latin-400.woff2',
  'public/fonts/literata-latin-600.woff2',
  'public/fonts/alegreya-sans-latin-400.woff2',
  'public/fonts/alegreya-sans-latin-500.woff2',
  'public/fonts/alegreya-sans-latin-700.woff2',
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

  it('declares one family per job: reading, register and machine voice', () => {
    expect(css).toMatch(/--font-serif:\s*"Literata"/);
    expect(css).toMatch(/--font-sans:\s*"Alegreya Sans"/);
    expect(css).toMatch(/--font-mono:\s*"JetBrains Mono"/);
  });

  it('drops Inter entirely rather than leaving a dead face behind', () => {
    expect(css).not.toContain('Inter');
    for (const weight of ['400', '500', '600']) {
      expect(existsSync(`public/fonts/inter-latin-${weight}.woff2`)).toBe(false);
    }
  });
});
