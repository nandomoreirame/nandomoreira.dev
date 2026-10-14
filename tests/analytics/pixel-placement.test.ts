import { describe, expect, it } from 'vitest';
import { showsPixel } from '../../src/lib/analytics/pixel-placement';

describe('showsPixel', () => {
  it('is on for prerendered human pages only', () => {
    expect(showsPixel({ isPrerendered: true, view: undefined })).toBe(true);
    expect(showsPixel({ isPrerendered: false, view: undefined })).toBe(false);
    expect(showsPixel({ isPrerendered: true, view: 'ai' })).toBe(false);
  });
});
