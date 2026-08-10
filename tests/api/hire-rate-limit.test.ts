import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIpOf, createLimiter } from '../../src/lib/hire/rate-limit';

const headersWith = (name: string, value: string) => new Headers({ [name]: value });

afterEach(() => {
  vi.useRealTimers();
});

describe('createLimiter', () => {
  it('answers false after the window budget is spent', () => {
    const limiter = createLimiter({ max: 5, windowMs: 600_000 });

    for (let i = 0; i < 5; i += 1) expect(limiter.check('1.2.3.4')).toBe(true);

    expect(limiter.check('1.2.3.4')).toBe(false);
  });

  it('counts each origin separately', () => {
    const limiter = createLimiter({ max: 1, windowMs: 600_000 });

    expect(limiter.check('1.1.1.1')).toBe(true);
    expect(limiter.check('2.2.2.2')).toBe(true);
    expect(limiter.check('1.1.1.1')).toBe(false);
  });

  it('lets the caller back in once the window has passed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));

    const limiter = createLimiter({ max: 1, windowMs: 600_000 });
    expect(limiter.check('1.2.3.4')).toBe(true);
    expect(limiter.check('1.2.3.4')).toBe(false);

    vi.setSystemTime(new Date('2026-08-10T12:10:01Z'));

    expect(limiter.check('1.2.3.4')).toBe(true);
  });

  it('does not extend the ban when the caller keeps hammering', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-10T12:00:00Z'));

    const limiter = createLimiter({ max: 1, windowMs: 600_000 });
    limiter.check('1.2.3.4');

    // Rejected attempts must not count as hits, or the window never drains.
    vi.setSystemTime(new Date('2026-08-10T12:05:00Z'));
    expect(limiter.check('1.2.3.4')).toBe(false);

    vi.setSystemTime(new Date('2026-08-10T12:10:01Z'));
    expect(limiter.check('1.2.3.4')).toBe(true);
  });
});

describe('createLimiter under abuse', () => {
  it('stays bounded when an attacker floods it with distinct keys', () => {
    // Every key stays inside the window, so freshness-based cleanup removes
    // nothing: without a hard cap the map grows until the instance dies.
    const limiter = createLimiter({ max: 5, windowMs: 600_000, maxKeys: 100 });

    for (let i = 0; i < 5_000; i += 1) limiter.check(`10.0.${Math.floor(i / 256)}.${i % 256}`);

    expect(limiter.size()).toBeLessThanOrEqual(100);
  });

  it('keeps limiting the most recent callers after an eviction storm', () => {
    const limiter = createLimiter({ max: 1, windowMs: 600_000, maxKeys: 10 });

    for (let i = 0; i < 100; i += 1) limiter.check(`10.0.0.${i}`);

    // The latest caller must still be counted, or flooding becomes a bypass.
    expect(limiter.check('10.0.0.99')).toBe(false);
  });
});

describe('clientIpOf', () => {
  it('reads the client IP from x-forwarded-for, not from the socket', () => {
    // App Hosting proxies every request; the socket IP would count all callers
    // as a single origin and the limit would never trigger per client.
    expect(clientIpOf(headersWith('x-forwarded-for', '9.9.9.9, 10.0.0.1'))).toBe('9.9.9.9');
  });

  it('ignores hops the caller prepended, which would otherwise defeat the limit', () => {
    // Google's load balancer APPENDS <client>, <lb>, so a client that sends its
    // own header pushes fakes to the FRONT. Trusting the first value lets one
    // caller rotate infinite identities.
    const spoofed = '1.1.1.1, 2.2.2.2, 203.0.113.7, 10.0.0.1';

    expect(clientIpOf(headersWith('x-forwarded-for', spoofed))).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip when the chain header is absent', () => {
    expect(clientIpOf(headersWith('x-real-ip', '8.8.8.8'))).toBe('8.8.8.8');
  });

  it('never returns an empty key, which would merge every anonymous caller silently', () => {
    expect(clientIpOf(new Headers())).toBe('unknown');
    expect(clientIpOf(headersWith('x-forwarded-for', '   '))).toBe('unknown');
  });
});
