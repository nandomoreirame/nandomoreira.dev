import { describe, expect, it } from 'vitest';
import { statusOf } from '../../src/lib/newsletter/store';

describe('legado', () => {
  it('registro sem status é tratado como confirmed', () => {
    expect(statusOf({ email: 'a@b.co' })).toBe('confirmed');
    expect(statusOf({ email: 'a@b.co', status: 'pending' })).toBe('pending');
  });
});
