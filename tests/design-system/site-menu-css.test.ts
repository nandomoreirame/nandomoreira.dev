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
    const open = rule('.site-menu:popover-open');

    expect(open).toMatch(/display:\s*flex/);
    expect(open).toMatch(/flex-direction:\s*column/);
  });

  it('never transforms the popover itself', () => {
    for (const selector of ['.site-menu', '.site-menu:popover-open']) {
      expect(rule(selector)).not.toMatch(/transform\s*:|scale\(/);
    }
    expect(css).not.toMatch(/@starting-style\s*\{\s*\.site-menu:popover-open\s*\{[^}]*transform/);
  });
});
