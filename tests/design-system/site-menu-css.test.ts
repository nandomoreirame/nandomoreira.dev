import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string) =>
  css.match(new RegExp(`${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('site-menu styles', () => {
  it('covers the whole viewport with the background token', () => {
    const base = rule('.site-menu');

    expect(base).toMatch(/height:\s*100dvh/);
    expect(base).toMatch(/width:\s*100%/);
    expect(base).toMatch(/position:\s*fixed/);
    expect(base).toMatch(/inset:\s*0/);
    expect(base).toMatch(/var\(--color-background\)/);
    expect(base).toMatch(/margin:\s*0/);
    expect(base).toMatch(/border:\s*0/);
  });

  it('fades in and out with allow-discrete, from the motion tokens', () => {
    const base = rule('.site-menu');

    expect(base).toMatch(/opacity:\s*0/);
    expect(base).toMatch(/var\(--duration-base\)/);
    expect(base).toMatch(/overlay var\(--duration-base\) allow-discrete/);
    expect(base).toMatch(/display var\(--duration-base\) allow-discrete/);
    expect(rule('.site-menu:popover-open')).toMatch(/opacity:\s*1/);
    expect(css).toMatch(/@starting-style\s*\{\s*\.site-menu:popover-open\s*\{[^}]*opacity:\s*0/);
  });

  it('becomes a column flex container when open', () => {
    expect(rule('.site-menu:popover-open')).toMatch(/display:\s*flex/);
  });

  // display stays flex through the closing fade (allow-discrete), but a rule on
  // :popover-open drops the moment it closes. A column direction declared only
  // there turned the menu into a row for the length of the fade: header and
  // list side by side, squashed to the right. Layout lives on the base rule.
  it('keeps the column layout while it fades out', () => {
    expect(rule('.site-menu')).toMatch(/flex-direction:\s*column/);
    expect(rule('.site-menu:popover-open')).not.toMatch(/flex-direction/);
  });

  it('never transforms the popover itself', () => {
    for (const selector of ['.site-menu', '.site-menu:popover-open']) {
      expect(rule(selector)).not.toMatch(/transform\s*:|scale\(/);
    }
    expect(css).not.toMatch(/@starting-style\s*\{\s*\.site-menu:popover-open\s*\{[^}]*transform/);
  });

  // The X turns in when the menu opens; it is the icon, not the button, that
  // moves, so the 44px hit target never shifts under the pointer.
  it('turns the close icon in on open', () => {
    expect(rule('.site-menu-close svg')).toMatch(/rotate\(/);
    expect(rule('.site-menu-close svg')).toMatch(/transition:[^;]*transform var\(--duration-base\)/);
    expect(rule('.site-menu:popover-open .site-menu-close svg')).toMatch(/transform:\s*none/);
    expect(css).toMatch(/@starting-style\s*\{[^@]*\.site-menu:popover-open \.site-menu-close svg\s*\{[^}]*rotate\(/);
  });

  // Each item rises and fades in on its own, one after another; closing drops
  // the stagger so every item is gone before the popover leaves the top layer.
  it('brings the items in one by one and takes them out together', () => {
    expect(rule('.site-menu li')).toMatch(/opacity:\s*0/);
    expect(rule('.site-menu li')).toMatch(/translateY\(/);
    expect(rule('.site-menu:popover-open li')).toMatch(/opacity:\s*1/);
    expect(rule('.site-menu:popover-open li')).toMatch(/transform:\s*none/);
    expect(css).toMatch(/@starting-style\s*\{[^@]*\.site-menu:popover-open li\s*\{[^}]*opacity:\s*0/);
    const delays = [...css.matchAll(/\.site-menu:popover-open li:nth-child\((\d+)\)\s*\{[^}]*transition-delay:/g)];
    expect(delays.length).toBeGreaterThanOrEqual(6);
    expect(rule('.site-menu li')).not.toMatch(/transition-delay/);
  });
});
