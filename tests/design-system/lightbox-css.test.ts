import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('lightbox styles', () => {
  it('keeps the whole image inside the viewport', () => {
    expect(rule('.lightbox > img')).toMatch(/max-width:\s*\d+vw/);
    expect(rule('.lightbox > img')).toMatch(/max-height:\s*\d+(vh|dvh)/);
  });

  it('dims the page behind it from the colour tokens', () => {
    expect(rule('.lightbox::backdrop')).toMatch(/var\(--color-background\)/);
  });

  // Tailwind's preflight sets margin: 0 on everything, which undoes the
  // margin: auto the browser uses to centre a popover.
  it('restores the auto margin that centres the popover', () => {
    expect(rule('.lightbox')).toMatch(/margin:\s*auto/);
  });

  // Fixed, not absolute: it sits in the corner of the screen, on the overlay,
  // instead of covering the corner of the image.
  it('pins the close button to the corner of the screen', () => {
    expect(rule('.lightbox-close')).toMatch(/position:\s*fixed/);
    expect(rule('.lightbox-close')).toMatch(/top:\s*var\(--spacing-/);
    expect(rule('.lightbox-close')).toMatch(/right:\s*var\(--spacing-/);
  });

  it('blurs the page behind it', () => {
    expect(rule('.lightbox::backdrop')).toMatch(/backdrop-filter:\s*blur\(var\(--blur-/);
  });

  // Opening and closing animate: the transition keeps the popover in the top
  // layer (overlay, display: allow-discrete) until the fade ends, and
  // @starting-style gives the open state somewhere to animate from.
  it('fades in and out, from the motion tokens', () => {
    const base = rule('.lightbox');
    expect(base).toMatch(/opacity:\s*0/);
    expect(base).toMatch(/var\(--duration-base\)/);
    expect(base).toMatch(/overlay var\(--duration-base\) allow-discrete/);
    expect(base).toMatch(/display var\(--duration-base\) allow-discrete/);
    expect(rule('.lightbox:popover-open')).toMatch(/opacity:\s*1/);
    expect(css).toMatch(/@starting-style\s*\{\s*\.lightbox:popover-open\s*\{[^}]*opacity:\s*0/);
  });

  // The close button is position: fixed, and any transform on the popover,
  // even mid-animation, makes the popover its containing block: the button
  // would flash inside the image before jumping to the corner. The zoom lives
  // on the image; the popover only fades.
  it('never transforms the popover itself, so the close button stays in the corner', () => {
    for (const selector of ['.lightbox', '.lightbox:popover-open']) {
      expect(rule(selector)).not.toMatch(/transform\s*:|scale\(/);
    }
    expect(css).not.toMatch(/@starting-style\s*\{\s*\.lightbox:popover-open\s*\{[^}]*transform/);
    expect(rule('.lightbox:popover-open > img')).toMatch(/transform:\s*none/);
  });
});
