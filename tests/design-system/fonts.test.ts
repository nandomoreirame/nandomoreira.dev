import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

// Terminal Noir pairing (2026-10-16): Newsreader carries the headings, Inter
// carries the body and the interface, JetBrains Mono carries the machine voice.
// Newsreader and Inter ship as variable fonts, instanced to the weights the
// site uses (Newsreader 400-500 and opsz 24-72, Inter 400-600), one file each.
const FONT_FILES = [
  'src/assets/fonts/newsreader-latin-variable.woff2',
  'src/assets/fonts/inter-latin-variable.woff2',
  'src/assets/fonts/jetbrains-mono-latin-400.woff2',
  'src/assets/fonts/jetbrains-mono-latin-500.woff2',
];

const RETIRED_FILES = [
  'src/assets/fonts/literata-latin-400.woff2',
  'src/assets/fonts/literata-latin-600.woff2',
  'src/assets/fonts/alegreya-sans-latin-400.woff2',
  'src/assets/fonts/alegreya-sans-latin-500.woff2',
  'src/assets/fonts/alegreya-sans-latin-700.woff2',
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

  it('lets the build fingerprint every font, so it can be cached for a year', () => {
    // /fonts/ in public/ is served with a 30-minute cache; an imported asset
    // lands in /_astro/ with a content hash and an immutable cache.
    expect(css).not.toMatch(/url\(\s*["']?\/fonts\//);
    expect(css.match(/url\("\.\.\/assets\/fonts\/[a-z0-9-]+\.woff2"\)/g) ?? []).toHaveLength(FONT_FILES.length);
    expect(existsSync('public/fonts')).toBe(false);
  });

  it('preloads the above-the-fold faces through their fingerprinted URLs', () => {
    const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
    expect(layout).not.toContain('href="/fonts/');
    expect(layout).toMatch(/from '\.\.\/assets\/fonts\/newsreader-latin-variable\.woff2\?url'/);
    expect(layout).toMatch(/from '\.\.\/assets\/fonts\/inter-latin-variable\.woff2\?url'/);
  });

  it('swaps rather than blocking, so text is never invisible while loading', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(faces.length).toBe(FONT_FILES.length);
    for (const face of faces) {
      expect(face).toContain('font-display: swap');
    }
  });

  it('declares the variable faces with the weight range they were instanced to', () => {
    const face = (family: string) =>
      (css.match(/@font-face\s*\{[^}]*\}/g) ?? []).find((block) => block.includes(`"${family}"`)) ?? '';
    expect(face('Newsreader')).toMatch(/font-weight:\s*400 500;/);
    expect(face('Inter')).toMatch(/font-weight:\s*400 600;/);
  });

  it('declares one family per job: headings, body and machine voice', () => {
    expect(css).toMatch(/--font-serif:\s*"Newsreader"/);
    expect(css).toMatch(/--font-sans:\s*"Inter"/);
    expect(css).toMatch(/--font-mono:\s*"JetBrains Mono"/);
  });

  it('drops Literata and Alegreya Sans entirely rather than leaving dead faces behind', () => {
    expect(css).not.toContain('Literata');
    expect(css).not.toContain('Alegreya');
    for (const file of RETIRED_FILES) expect(existsSync(file)).toBe(false);
  });
});
