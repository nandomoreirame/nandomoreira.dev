import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '';

// Terminal Noir's Shiki theme paints every block on the page background.
const CODE_BACKGROUND = '#0b0b0c';

describe('code blocks keep their lines intact', () => {
  // Wrapping was tried on 2026-10-10 and reverted: code reads as written, and
  // a long line scrolls sideways instead of breaking.
  it('never wraps a line, and scrolls sideways when it is too long', () => {
    const block = rule('.astro-code');
    expect(block).toMatch(/white-space:\s*pre;/);
    expect(block).toMatch(/overflow-x:\s*auto/);
    expect(css).not.toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('drops the hanging indent that only made sense while wrapping', () => {
    expect(css).not.toMatch(/text-indent:\s*calc\(-1 \* var\(--code-gutter\)\)/);
  });

  it('gives the sideways scrollbar a thin bar in the palette', () => {
    const block = rule('.astro-code');
    expect(block).toMatch(/scrollbar-width:\s*thin/);
    expect(block).toMatch(/scrollbar-color:\s*var\(--color-[a-z-]+\)\s+transparent/);
  });
});

describe('project scrollbars', () => {
  it('paints every scrollbar from the colour tokens, never the browser default', () => {
    const html = rule('html');
    expect(html).toMatch(/scrollbar-color:\s*var\(--color-border-strong\)\s+var\(--color-background\)/);
  });
});

describe('code blocks number their lines', () => {
  // Less empty space left of the numbers, more between number and code.
  it('keeps the number column tight and separates it from the code', () => {
    const before = rule('.astro-code .line::before');
    expect(before).toMatch(/width:\s*2ch/);
    expect(before).toMatch(/margin-right:\s*2ch/);
  });

  it('counts lines per block', () => {
    expect(rule('.astro-code code')).toMatch(/counter-reset:\s*code-line/);
    expect(rule('.astro-code .line::before')).toMatch(/counter-increment:\s*code-line/);
  });

  it('keeps the numbers out of copies and away from screen readers', () => {
    const before = rule('.astro-code .line::before');
    // Generated content is never selected; the empty alt text hides it from AT.
    expect(before).toMatch(/content:\s*counter\(code-line\)\s*\/\s*""/);
    expect(before).toMatch(/user-select:\s*none/);
  });

  it('paints the numbers in a colour that meets AA on the code background', () => {
    expect(rule('.astro-code .line::before')).toMatch(/color:\s*var\(--color-muted-foreground\)/);
    expect(contrastRatio(token('muted-foreground'), CODE_BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });
});
