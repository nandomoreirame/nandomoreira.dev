import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

describe('code toolbar styles', () => {
  it('pins the toolbar to the top right of the block, outside the scrolling area', () => {
    expect(rule('.code-block')).toMatch(/position:\s*relative/);
    expect(rule('.code-toolbar')).toMatch(/position:\s*absolute/);
  });

  // It sits over the first lines of code, so it stays out of the way until wanted.
  it('hides the toolbar until the block is hovered or reached by keyboard', () => {
    const toolbar = rule('.code-toolbar');
    expect(toolbar).toMatch(/opacity:\s*0/);
    expect(toolbar).toMatch(/pointer-events:\s*none/);
    expect(css).toMatch(/\.code-block:hover \.code-toolbar,\s*\.code-block:focus-within \.code-toolbar\s*\{[^}]*opacity:\s*1[^}]*pointer-events:\s*auto/);
  });

  it('shows the tooltip on hover and on keyboard focus', () => {
    expect(css).toMatch(/\.code-action:hover \.code-tooltip,\s*\.code-action:has\(:focus-visible\) \.code-tooltip/);
  });

  it('draws a focus ring on the action when its control has keyboard focus', () => {
    expect(rule('.code-action:has(:focus-visible)')).toMatch(/outline:/);
  });

  // Shiki writes each token colour inline, so only !important overrides it.
  it('drops the token colours and the line numbers in raw view', () => {
    expect(rule('.code-block:has(.code-raw-toggle:checked) .astro-code span')).toMatch(/color:\s*inherit\s*!important/);
    expect(rule('.code-block:has(.code-raw-toggle:checked) .astro-code .line::before')).toMatch(/content:\s*none/);
  });

  it('marks the raw action as on while the raw view is showing', () => {
    expect(rule('.code-action:has(.code-raw-toggle:checked)')).toMatch(/color:\s*var\(--color-primary\)/);
  });
});
