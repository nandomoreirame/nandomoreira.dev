import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

/** Removes every `@media <query> { ... }` block, matching braces. */
const without = (source: string, query: string): string => {
  let result = source;
  for (;;) {
    const start = result.indexOf(`@media ${query}`);
    if (start === -1) return result;
    let depth = 0;
    let end = result.indexOf('{', start);
    for (; end < result.length; end += 1) {
      if (result[end] === '{') depth += 1;
      if (result[end] === '}' && --depth === 0) break;
    }
    result = result.slice(0, start) + result.slice(end + 1);
  }
};

const outsideMotion = without(css, '(prefers-reduced-motion: no-preference)');

describe('art motion', () => {
  it('defines the art and the pointer field', () => {
    expect(css).toContain('.art-hero');
    expect(css).toContain('.pointer-field::after');
    expect(css).toMatch(/@keyframes art-drift/);
  });

  it('animates the banner only when the visitor has not asked for less motion', () => {
    expect(css).toMatch(/animation:\s*art-drift/);
    expect(outsideMotion).not.toMatch(/animation:\s*art-drift/);
  });

  it('eases the pointer glow and the parallax only under no-preference', () => {
    expect(outsideMotion).not.toMatch(/transition:[^;]*--gx/);
    expect(outsideMotion).not.toMatch(/\.art-layer\s*\{[^}]*transition/);
  });

  it('colours the art through tokens', () => {
    expect(css).toMatch(/\.art-hero\s*\{[^}]*var\(--color-primary\)/);
    expect(css).toMatch(/\.art-base\s*\{[^}]*var\(--color-muted-foreground\)/);
    expect(css).toMatch(/\.art-faint\s*\{[^}]*var\(--color-border-strong\)/);
  });

  it('moves the parallax with transform only, never a layout property', () => {
    const layer = css.match(/\.art-layer\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(layer).toMatch(/transform:/);
    expect(layer).not.toMatch(/\b(top|left|margin|padding|width|height):/);
  });
});
