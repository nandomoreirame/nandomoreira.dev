import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
};

describe('AI view tabs, pure CSS (REQ-005)', () => {
  it('hides the source panel until its tab is chosen', () => {
    expect(rule('.ai-panel-source')).toMatch(/display:\s*none/);
  });

  it('swaps the panels when the source tab is checked, with no script', () => {
    expect(rule(':root:has(#ai-tab-source:checked) .ai-panel-source')).toMatch(/display:\s*block/);
    expect(rule(':root:has(#ai-tab-source:checked) .ai-panel-rendered')).toMatch(/display:\s*none/);
  });

  it('marks the chosen tab with the foreground on a raised surface, never amber on amber', () => {
    expect(rule('.ai-tab-label')).toContain('var(--color-muted-foreground)');
    const chosen = rule('.ai-tab-input:checked + .ai-tab-label');
    expect(chosen).toContain('color: var(--color-foreground)');
    expect(chosen).toContain('var(--color-surface-elevated)');
  });

  it('shows the keyboard focus of the hidden radio on its label', () => {
    expect(rule('.ai-tab-input:focus-visible + .ai-tab-label')).toMatch(/outline:[^;]*var\(--color-primary\)/);
  });
});

describe('Cap-height trim for labels set beside an icon', () => {
  it('trims the text box to the capitals, so flex centring aligns letters, not line boxes', () => {
    expect(rule('.text-trim-cap')).toMatch(/text-box:\s*trim-both cap alphabetic/);
  });
});

describe('Contact interest checkboxes, pure CSS', () => {
  it('draws the box at rest with a contour that clears 3:1', () => {
    expect(rule('.check-box')).toMatch(/border-color:\s*var\(--color-border-strong\)/);
    expect(rule('.check-box')).toMatch(/color:\s*transparent/);
  });

  it('paints the resting background in the rule, so a utility cannot beat the checked state', () => {
    expect(rule('.check-box')).toMatch(/background-color:\s*var\(--color-background\)/);
  });

  it('fills a checked box with the accent and shows the check mark', () => {
    const checked = rule('.check-input:checked + .check-box');
    expect(checked).toMatch(/border-color:\s*var\(--color-primary\)/);
    expect(checked).toMatch(/background-color:\s*var\(--color-primary\)/);
    expect(checked).toMatch(/color:\s*var\(--color-primary-foreground\)/);
  });

  it('reflects keyboard focus from the hidden checkbox onto the box', () => {
    expect(rule('.check-input:focus-visible + .check-box')).toMatch(/outline:\s*2px solid var\(--color-primary\)/);
  });

  it('drops the old chip rules', () => {
    expect(rule('.chip')).toBe('');
  });
});
