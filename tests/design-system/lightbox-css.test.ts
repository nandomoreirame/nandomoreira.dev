import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('lightbox styles', () => {
  it('keeps the whole image inside the viewport', () => {
    expect(rule('.lightbox-image')).toMatch(/max-width:\s*\d+vw/);
    expect(rule('.lightbox-image')).toMatch(/max-height:\s*\d+(vh|dvh)/);
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
});
