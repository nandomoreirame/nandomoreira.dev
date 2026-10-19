import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const block = css.slice(css.indexOf('/* Command palette'), css.indexOf('/* End command palette */'));

describe('palette style', () => {
  it('reads a real block, between both markers', () => {
    expect(css.indexOf('/* Command palette')).toBeGreaterThan(-1);
    expect(css.indexOf('/* End command palette */')).toBeGreaterThan(css.indexOf('/* Command palette'));
    expect(block.length).toBeGreaterThan(0);
  });

  it('marks the active option with more than color: an inset primary bar', () => {
    expect(block).toMatch(
      /\.palette-list \[role='option'\]\[aria-selected='true'\]\s*\{[^}]*box-shadow:\s*inset 2px 0 0 var\(--color-primary\)/,
    );
  });

  it('shows the hint as inline-flex and hides it on touch screens', () => {
    expect(block).toMatch(/\[data-palette-hint\]\s*\{\s*display:\s*inline-flex;?\s*\}/);
    expect(block).toMatch(/@media \(hover: none\)\s*\{\s*\[data-palette-hint\]\s*\{\s*display:\s*none;?\s*\}/);
  });

  it('fades and scales in and out with the motion tokens, keeping the exit visible', () => {
    expect(block).toMatch(/\.palette\[open\]\s*\{[^}]*opacity:\s*1/);
    expect(block).toMatch(/@starting-style\s*\{\s*\.palette\[open\]/);
    expect(block).toMatch(/overlay var\(--duration-base\) allow-discrete/);
    expect(block).toMatch(/display var\(--duration-base\) allow-discrete/);
    expect(block).toMatch(/transform var\(--duration-base\) var\(--ease-out\)/);
    expect(block).toMatch(/\.palette::backdrop/);
  });

  it('drops the motion for reduced motion', () => {
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.palette/);
    expect(block).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*\.palette-toast/);
  });

  it('opens 20% narrower than the original 36rem, and 20% shorter again than 56dvh', () => {
    expect(block).toMatch(/\.palette\s*\{[^}]*width:\s*min\(28\.8rem,/);
    expect(block).toMatch(/\.palette\s*\{[^}]*max-height:\s*44\.8dvh/);
    expect(block).toMatch(/\.palette-list\s*\{[^}]*max-height:\s*calc\(44\.8dvh - 4rem\)/);
  });

  it('has no outer border, only the shadow over the backdrop', () => {
    expect(block).toMatch(/\.palette\s*\{[^}]*border:\s*0;/);
  });

  it('rules the input with a gray a little darker than border-strong', () => {
    expect(block).toMatch(
      /\.palette input\s*\{\s*border-bottom-color:\s*color-mix\(in oklab, var\(--color-border-strong\) 60%, var\(--color-surface\)\);/,
    );
  });

  it('keeps the toast out of sight until it opens, above the corner buttons', () => {
    expect(block).toMatch(/\.palette-toast\s*\{[^}]*visibility:\s*hidden/);
    expect(block).toMatch(/\.palette-toast\s*\{[^}]*position:\s*fixed/);
    expect(block).toMatch(/\.palette-toast\[data-open\]\s*\{[^}]*visibility:\s*visible/);
  });

  it('hides the shortcut keys on touch screens', () => {
    expect(block).toMatch(/@media \(hover: none\)\s*\{[^@]*\.palette-list kbd\s*\{\s*display:\s*none/);
  });

  it('locks the page scroll while the palette is open', () => {
    expect(block).toMatch(/html:has\(\.palette\[open\]\)\s*\{\s*overflow:\s*hidden/);
  });

  it('sits in the middle of the viewport', () => {
    expect(block).toMatch(/\.palette\s*\{[^}]*margin:\s*auto;/);
  });

  it('scrolls the list without showing a scrollbar', () => {
    expect(block).toMatch(/\.palette-list\s*\{[^}]*scrollbar-width:\s*none/);
    expect(block).toMatch(/\.palette-list::-webkit-scrollbar\s*\{\s*display:\s*none/);
  });

  it('uses tokens only', () => {
    expect(block).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });
});
