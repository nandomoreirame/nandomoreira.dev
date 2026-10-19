import { describe, expect, it } from 'vitest';
import { GO_WINDOW_MS, goPathFor, isTypingTarget } from '../../src/lib/search/go-sequence';

describe('G + letter', () => {
  it('resolves a mapped letter pressed within the window after G', () => {
    expect(goPathFor({ armedAt: 1000, now: 1500, key: 'b' })).toBe('/posts');
    expect(goPathFor({ armedAt: 1000, now: 1000 + GO_WINDOW_MS + 1, key: 'b' })).toBeUndefined();
    expect(goPathFor({ armedAt: undefined, now: 1500, key: 'b' })).toBeUndefined();
    expect(goPathFor({ armedAt: 1000, now: 1200, key: 'x' })).toBeUndefined();
  });

  it('is case-insensitive', () => {
    expect(goPathFor({ armedAt: 0, now: 10, key: 'H' })).toBe('/');
  });

  it('never fires while typing', () => {
    expect(isTypingTarget({ tagName: 'INPUT', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'TEXTAREA', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'SELECT', isContentEditable: false })).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: 'A', isContentEditable: false })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});
