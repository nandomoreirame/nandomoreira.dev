import { describe, expect, it } from 'vitest';
import { readAnalyticsConfig } from '../../src/lib/analytics/config';
import { createRecorder } from '../../src/lib/analytics/recorder';
import type { AnalyticsStore } from '../../src/lib/analytics/store';
import { memoryAnalyticsStore } from '../helpers/analytics-store';

const SECRET = 's'.repeat(32);
const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/129.0 Safari/537.36';
const now = () => new Date('2026-10-14T17:02:00.000Z');

const request = (headers: Record<string, string> = {}) =>
  new Request('https://nandomoreira.dev/sobre', {
    headers: { 'user-agent': CHROME, 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'cf-ipcountry': 'BR', ...headers },
  });

const hit = { kind: 'pageview' as const, path: '/sobre', source: 'ssr' as const, referrer: 'https://www.google.com/' };

describe('readAnalyticsConfig', () => {
  it('accepts secrets of at least 32 characters and nothing shorter', () => {
    expect(readAnalyticsConfig({ ANALYTICS_HASH_SECRET: SECRET, ANALYTICS_SELF_TOKEN: ` ${SECRET} ` })).toEqual({
      hashSecret: SECRET,
      selfToken: SECRET,
    });
    expect(readAnalyticsConfig({ ANALYTICS_HASH_SECRET: 'short' })).toEqual({ hashSecret: null, selfToken: null });
  });
});

describe('createRecorder', () => {
  it('records a pageview with a hash and no ip', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.record(request(), hit);

    expect(memory.events).toHaveLength(1);
    expect(memory.events[0]).toMatchObject({ path: '/sobre', channel: 'google', country: 'BR', class: 'human' });
    expect(JSON.stringify(memory.events[0])).not.toContain('203.0.113.7');
  });

  it('records the city and state from the Cloudflare location headers', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.record(request({ 'cf-ipcity': 'Curitiba', 'cf-region': 'Paraná' }), hit);

    expect(memory.events[0]).toMatchObject({ city: 'Curitiba', region: 'Paraná' });
  });

  it('records nothing without the secret', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: null, selfToken: null }, now });
    await recorder.record(request(), hit);
    expect(memory.daily.size).toBe(0);
  });

  it('ignores the old nm_self cookie, which Firebase App Hosting never forwards', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });
    await recorder.record(request({ cookie: 'nm_self=1' }), hit);
    expect(memory.daily.size).toBe(1);
  });

  it('records nothing for the author', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });
    await recorder.record(request({ cookie: 'a=b; __session=self' }), hit);
    expect(memory.daily.size).toBe(0);
  });

  it('records nothing for the author when the same cookie also stores the grid', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });
    await recorder.record(request({ cookie: '__session=self.grid' }), hit);
    expect(memory.daily.size).toBe(0);
  });

  it('still records a visitor whose session cookie only stores the grid', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });
    await recorder.record(request({ cookie: '__session=grid' }), hit);
    expect(memory.daily.size).toBe(1);
  });

  it('gives up after the timeout and never throws', async () => {
    const slow: AnalyticsStore = { record: () => new Promise(() => {}), eventsOf: () => new Promise(() => {}) };
    const failing: AnalyticsStore = {
      record: () => Promise.reject(new Error('down')),
      eventsOf: () => Promise.reject(new Error('down')),
    };
    const config = { hashSecret: SECRET, selfToken: null };

    const started = Date.now();
    await createRecorder({ store: slow, config, now, timeoutMs: 50 }).record(request(), hit);
    expect(Date.now() - started).toBeLessThan(500);

    await expect(createRecorder({ store: failing, config, now }).record(request(), hit)).resolves.toBeUndefined();
    await expect(createRecorder({ store: failing, config, now }).journey(request())).resolves.toBeUndefined();
  });

  it('finds the journey of the same visitor on the same day', async () => {
    const memory = memoryAnalyticsStore();
    const recorder = createRecorder({ store: memory.store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.record(request(), hit);
    await recorder.record(request({ 'user-agent': `${CHROME} Other` }), { ...hit, path: '/lab' });

    const journey = await recorder.journey(request());
    expect(journey?.views.map(view => view.path)).toEqual(['/sobre']);
  });

  it('writes several hits of one request in a single store call', async () => {
    const batches: number[] = [];
    const memory = memoryAnalyticsStore();
    const store: AnalyticsStore = { ...memory.store, record: async events => void batches.push(events.length) };
    const recorder = createRecorder({ store, config: { hashSecret: SECRET, selfToken: null }, now });

    await recorder.recordAll(request(), [hit, { ...hit, path: '/lab' }, { ...hit, path: '/now' }]);

    expect(batches).toEqual([3]);
  });

  it('says whether this request would be recorded at all', () => {
    const on = createRecorder({
      store: memoryAnalyticsStore().store,
      config: { hashSecret: SECRET, selfToken: null },
      now,
    });
    const off = createRecorder({
      store: memoryAnalyticsStore().store,
      config: { hashSecret: null, selfToken: null },
      now,
    });

    expect(on.active(request())).toBe(true);
    expect(on.active(request({ cookie: '__session=self' }))).toBe(false);
    expect(on.active(request({ cookie: '__session=self.grid' }))).toBe(false);
    expect(on.active(request({ cookie: '__session=grid' }))).toBe(true);
    expect(off.active(request())).toBe(false);
  });
});
