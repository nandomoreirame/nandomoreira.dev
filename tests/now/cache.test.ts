import { describe, expect, it, vi } from 'vitest';
import { createCachedSource } from '../../src/lib/now/cache';

const clock = (start = 0) => {
  let t = start;
  return { now: () => t, advance: (ms: number) => { t += ms; } };
};

describe('createCachedSource', () => {
  it('calls the loader once inside the TTL', async () => {
    const c = clock();
    const load = vi.fn().mockResolvedValue(['a']);
    const get = createCachedSource({ ttlMs: 1000, load, now: c.now });
    await get();
    c.advance(999);
    expect(await get()).toEqual(['a']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('reloads after the TTL', async () => {
    const c = clock();
    const load = vi.fn().mockResolvedValueOnce(['a']).mockResolvedValueOnce(['b']);
    const get = createCachedSource({ ttlMs: 1000, load, now: c.now });
    await get();
    c.advance(1000);
    expect(await get()).toEqual(['b']);
  });

  it('serves the last good value when the reload fails', async () => {
    const c = clock();
    const load = vi.fn().mockResolvedValueOnce(['a']).mockRejectedValueOnce(new Error('down'));
    const get = createCachedSource({ ttlMs: 1000, load, now: c.now });
    await get();
    c.advance(5000);
    expect(await get()).toEqual(['a']);
  });

  it('rejects when there was never a good value', async () => {
    const get = createCachedSource({ ttlMs: 1000, load: () => Promise.reject(new Error('down')), now: () => 0 });
    await expect(get()).rejects.toThrow('down');
  });

  it('shares one in-flight load between concurrent callers', async () => {
    const load = vi.fn().mockResolvedValue(['a']);
    const get = createCachedSource({ ttlMs: 1000, load, now: () => 0 });
    await Promise.all([get(), get(), get()]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not retry a failing source inside the failure window', async () => {
    const c = clock();
    const load = vi.fn().mockResolvedValueOnce(['a']).mockRejectedValue(new Error('down'));
    const get = createCachedSource({ ttlMs: 1000, failureTtlMs: 60_000, load, now: c.now });
    await get();
    c.advance(1000);
    expect(await get()).toEqual(['a']);
    c.advance(30_000);
    expect(await get()).toEqual(['a']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('rejects fast without calling the source after a first failure', async () => {
    const c = clock();
    const load = vi.fn().mockRejectedValue(new Error('down'));
    const get = createCachedSource({ ttlMs: 1000, failureTtlMs: 60_000, load, now: c.now });
    await expect(get()).rejects.toThrow('down');
    c.advance(10_000);
    await expect(get()).rejects.toThrow('down');
    expect(load).toHaveBeenCalledTimes(1);
    c.advance(60_000);
    await expect(get()).rejects.toThrow('down');
    expect(load).toHaveBeenCalledTimes(2);
  });
});
