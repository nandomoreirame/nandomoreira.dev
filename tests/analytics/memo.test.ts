import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cachedUnlessRejected } from '../../src/lib/analytics/memo';

describe('cachedUnlessRejected', () => {
  it('loads once and serves the same value afterwards', async () => {
    let calls = 0;
    const get = cachedUnlessRejected(async () => ++calls);

    expect(await get()).toBe(1);
    expect(await get()).toBe(1);
    expect(calls).toBe(1);
  });

  it('forgets a failed load, so the next request tries again', async () => {
    let calls = 0;
    const get = cachedUnlessRejected(async () => {
      calls += 1;
      if (calls === 1) throw new Error('cold start');
      return 'ok';
    });

    await expect(get()).rejects.toThrow('cold start');
    expect(await get()).toBe('ok');
    expect(await get()).toBe('ok');
    expect(calls).toBe(2);
  });
});

describe('routes that cache their content tables', () => {
  it('never keep a rejected promise for the life of the process', () => {
    for (const file of ['src/pages/v.gif.ts', 'src/pages/go/[...target].ts']) {
      const source = readFileSync(file, 'utf8');
      expect(source, file).toContain('cachedUnlessRejected(');
      expect(source, file).not.toContain('??=');
    }
  });
});
