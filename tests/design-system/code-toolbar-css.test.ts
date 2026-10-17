import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

describe('code toolbar styles', () => {
  it('frames the whole block, header included, and clips the corners', () => {
    const block = rule('.code-block');
    expect(block).toMatch(/border:\s*1px solid var\(--color-border-strong\)/);
    expect(block).toMatch(/border-radius:\s*var\(--radius-md\)/);
    expect(block).toMatch(/overflow:\s*hidden/);
  });

  it('keeps the header visible, with a hairline under it', () => {
    const header = rule('.code-header');
    expect(header).toMatch(/display:\s*flex/);
    expect(header).toMatch(/border-bottom:\s*1px solid var\(--color-border\)/);
    expect(header).not.toMatch(/opacity:\s*0/);
    expect(css).not.toContain('.code-toolbar');
    expect(css).not.toContain('.code-tooltip');
  });

  it('draws the dot in the accent and pushes the actions right', () => {
    expect(rule('.code-dot')).toMatch(/background-color:\s*var\(--color-primary\)/);
    expect(rule('.code-actions')).toMatch(/margin-left:\s*auto/);
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
