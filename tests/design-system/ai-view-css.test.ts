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
    expect(rule('.ai-view:has(#ai-tab-source:checked) .ai-panel-source')).toMatch(/display:\s*block/);
    expect(rule('.ai-view:has(#ai-tab-source:checked) .ai-panel-rendered')).toMatch(/display:\s*none/);
  });

  it('marks the chosen tab through tokens', () => {
    const chosen = rule('.ai-tab-input:checked + .ai-tab-label');
    expect(chosen).toContain('var(--color-primary)');
    expect(chosen).toContain('var(--color-primary-foreground)');
  });

  it('shows the keyboard focus of the hidden radio on its label', () => {
    expect(rule('.ai-tab-input:focus-visible + .ai-tab-label')).toMatch(/outline:[^;]*var\(--color-primary\)/);
  });
});
