import { describe, expect, it } from 'vitest';
import { EN_LIVE, enLive } from '../../src/lib/i18n/live';

describe('enLive', () => {
  it('is off in production until the flag flips', () => {
    expect(enLive({ DEV: false, MODE: 'production' }, false)).toBe(false);
    expect(enLive({ DEV: false, MODE: 'production' }, true)).toBe(true);
  });

  it('is always on in astro dev and in the staging build', () => {
    expect(enLive({ DEV: true, MODE: 'development' }, false)).toBe(true);
    expect(enLive({ DEV: false, MODE: 'staging' }, false)).toBe(true);
  });

  it('follows the flag under Vitest, so the suite checks what production serves', () => {
    expect(enLive({ DEV: false, MODE: 'test' }, false)).toBe(false);
  });

  it('ships off: i18n-content flips it (C7)', () => {
    expect(EN_LIVE).toBe(false);
  });
});
