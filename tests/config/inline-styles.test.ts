import { describe, expect, it } from 'vitest';
import config from '../../astro.config.mjs';

describe('render-blocking CSS', () => {
  // One stylesheet request before first paint cost ~540 ms on mobile
  // PageSpeed (2026-10-09). Inlined, the CSS arrives with the HTML.
  it('inlines every stylesheet into the page', () => {
    expect(config.build?.inlineStylesheets).toBe('always');
  });
});
