import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

describe('motion', () => {
  it('honours the reduced-motion preference', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
  });

  it('keeps state changes visible when motion is suppressed', () => {
    const block = css.slice(css.indexOf('prefers-reduced-motion'));
    expect(block).toContain('animation-duration: 0.01ms');
    expect(block).toContain('transition-duration: 0.01ms');
    expect(block).not.toContain('display: none');
  });

  it('only ever transitions transform and opacity by default', () => {
    expect(css).toContain('transition-property: transform, opacity');
  });
});
