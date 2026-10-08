import { describe, expect, it } from 'vitest';
import { createRandom, hashString, intBetween } from '../../src/lib/art/random';

describe('hashString', () => {
  it('is the 32-bit FNV-1a hash, stable across runtimes', () => {
    expect(hashString('a')).toBe(0xe40c292c);
    expect(hashString('')).toBe(0x811c9dc5);
  });

  it('separates slugs that differ by one character', () => {
    expect(hashString('ai-tooling:forja')).not.toBe(hashString('ai-tooling:forje'));
  });
});

describe('createRandom', () => {
  it('replays the same sequence for the same seed', () => {
    const a = createRandom(42);
    const b = createRandom(42);
    const first = Array.from({ length: 5 }, a);
    expect(Array.from({ length: 5 }, b)).toEqual(first);
  });

  it('stays inside [0, 1)', () => {
    const random = createRandom(7);
    for (let i = 0; i < 1000; i += 1) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('intBetween', () => {
  it('includes both ends', () => {
    const random = createRandom(1);
    const seen = new Set(Array.from({ length: 500 }, () => intBetween(random, 2, 4)));
    expect([...seen].sort()).toEqual([2, 3, 4]);
  });
});
