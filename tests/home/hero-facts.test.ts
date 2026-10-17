import { describe, expect, it } from 'vitest';
import { HERO_FACTS } from '../../src/lib/home/hero';

describe('HERO_FACTS', () => {
  it('abbreviates the stack and states the location, as approved', () => {
    expect(HERO_FACTS).toEqual({ stack: 'TS, Py, Rust, LLM ops', location: 'São Paulo / Remote' });
  });
});
