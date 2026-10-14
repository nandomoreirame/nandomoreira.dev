import { describe, expect, it } from 'vitest';
import { visitorHash } from '../../src/lib/analytics/visitor';

const base = {
  secret: 's'.repeat(32),
  day: '2026-10-14',
  ip: '203.0.113.7',
  userAgent: 'Mozilla/5.0 Chrome',
};

describe('visitorHash', () => {
  it('is stable within a day', () => {
    expect(visitorHash(base)).toBe(visitorHash({ ...base }));
  });

  it('is 16 bytes of hex', () => {
    expect(visitorHash(base)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('changes with the day, the ip, the user agent and the secret', () => {
    const hash = visitorHash(base);
    expect(visitorHash({ ...base, day: '2026-10-15' })).not.toBe(hash);
    expect(visitorHash({ ...base, ip: '203.0.113.8' })).not.toBe(hash);
    expect(visitorHash({ ...base, userAgent: 'Mozilla/5.0 Firefox' })).not.toBe(hash);
    expect(visitorHash({ ...base, secret: 't'.repeat(32) })).not.toBe(hash);
  });

  it('never carries the ip', () => {
    expect(visitorHash(base)).not.toContain('203');
  });
});
