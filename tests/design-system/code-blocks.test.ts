import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '../../src/lib/contrast';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};
const token = (name: string) => css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))?.[1] ?? '';

// Shiki's github-dark-default paints every block on this background.
const CODE_BACKGROUND = '#0d1117';

describe('code blocks wrap long lines', () => {
  it('wraps instead of scrolling sideways', () => {
    expect(rule('.astro-code')).toMatch(/white-space:\s*pre-wrap/);
    expect(rule('.astro-code .line')).toMatch(/overflow-wrap:\s*anywhere/);
  });

  it('hangs wrapped continuations under the code, not under the line number', () => {
    const line = rule('.astro-code .line');
    expect(line).toMatch(/padding-left:\s*var\(--code-gutter\)/);
    expect(line).toMatch(/text-indent:\s*calc\(-1 \* var\(--code-gutter\)\)/);
  });
});

describe('code blocks number their lines', () => {
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
