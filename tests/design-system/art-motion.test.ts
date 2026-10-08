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

  it('compensates the ::after inset so the glow sits under the cursor', () => {
    const mask = css.match(/\.pointer-field::after\s*\{[^}]*mask-image:[^;]+/)?.[0] ?? '';
    expect(mask).toContain('calc(var(--gx) + var(--spacing-lg))');
    expect(mask).toContain('calc(var(--gy) + var(--spacing-lg))');
  });

  it('drops --gx/--gy easing while data-snap is set, only under no-preference', () => {
    const motion = css.match(
      /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*\{([\s\S]*)\}\s*$/,
    )?.[1] ?? css.slice(css.indexOf('@media (prefers-reduced-motion: no-preference)'));
    expect(motion).toMatch(/\.pointer-field\[data-snap\]::after\s*\{[^}]*transition:/);
    const snap = motion.match(/\.pointer-field\[data-snap\]::after\s*\{([^}]*)\}/)?.[1] ?? '';
    expect(snap).toMatch(/transition:/);
    expect(snap).not.toMatch(/--gx/);
    expect(outsideMotion).not.toMatch(/\.pointer-field\[data-snap\]/);
  });
});
