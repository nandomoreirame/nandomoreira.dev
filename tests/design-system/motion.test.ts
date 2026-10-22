import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');

/** The bodies of `@media (prefers-reduced-motion: reduce)`, and nothing after them. */
const reduceBlocks = (source: string): string[] => {
  const blocks: string[] = [];
  for (const match of source.matchAll(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/g)) {
    const open = source.indexOf('{', match.index ?? 0);
    if (open === -1) continue;
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      if (source[index] === '{') depth += 1;
      else if (source[index] === '}') {
        depth -= 1;
        if (depth === 0) {
          blocks.push(source.slice(open, index + 1));
          break;
        }
      }
    }
  }
  return blocks;
};

describe('motion', () => {
  it('honours the reduced-motion preference', () => {
    expect(css).toContain('prefers-reduced-motion: reduce');
    // Smooth anchor scrolling is motion too, and the reduce block already
    // overrides scroll-behavior. Assert the pairing so enabling one without
    // the other can never ship.
    expect(css).toMatch(/scroll-behavior:\s*auto\s*!important/);
  });

  it('treats display:none inside a reduce query as hiding the change', () => {
    const sample = '@media (prefers-reduced-motion: reduce) { .x { display: none; } }';
    expect(reduceBlocks(sample).join('\n')).toContain('display: none');
    expect(reduceBlocks('@media (prefers-reduced-motion: no-preference) { .x { display: none; } }')).toEqual([]);
  });

  it('keeps state changes visible when motion is suppressed', () => {
    const blocks = reduceBlocks(css);
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) expect(block).not.toContain('display: none');
    const durations = css.slice(css.indexOf('prefers-reduced-motion: reduce'));
    expect(durations).toContain('animation-duration: 0.01ms');
    expect(durations).toContain('transition-duration: 0.01ms');
  });

  it('only ever transitions transform and opacity by default', () => {
    expect(css).toContain('transition-property: transform, opacity');
  });
});
