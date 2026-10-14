import { describe, expect, it } from 'vitest';
import { OWN_HOSTS } from '../../src/lib/analytics/channel';
import { handlePixel } from '../../src/lib/analytics/pixel';
import type { Hit } from '../../src/lib/analytics/recorder';
import { createLimiter } from '../../src/lib/hire/rate-limit';

const setup = (max = 30) => {
  const hits: Hit[] = [];
  const deps = {
    recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) },
    limiter: createLimiter({ max, windowMs: 60_000 }),
    knownPaths: async () => new Set(['/lab/forja', '/sessoes-do-red-dead']),
    ownHosts: OWN_HOSTS,
  };
  const pixel = (referer?: string, method = 'GET') =>
    handlePixel(
      new Request('https://nandomoreira.dev/v.gif', {
        method,
        headers: { ...(referer ? { referer } : {}), 'x-forwarded-for': '203.0.113.7' },
      }),
      deps,
    );
  return { hits, pixel };
};

describe('handlePixel', () => {
  it('always answers an uncacheable 1x1 GIF', async () => {
    const { pixel } = setup();
    const response = await pixel();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/gif');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(new Uint8Array(await response.arrayBuffer()).slice(0, 6)).toEqual(new TextEncoder().encode('GIF89a'));
  });

  it('records the page and UTMs from a same-site referer', async () => {
    const { hits, pixel } = setup();
    await pixel('https://nandomoreira.dev/lab/forja/?utm_source=linkedin');
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ kind: 'pageview', path: '/lab/forja', source: 'pixel', referrer: null });
    expect(hits[0]?.search?.get('utm_source')).toBe('linkedin');
  });

  it('records nothing for a foreign or missing referer, an unknown page, or a non-GET', async () => {
    const { hits, pixel } = setup();
    await pixel();
    await pixel('https://evil.example/lab/forja');
    await pixel('https://nandomoreira.dev/nao-existe');
    await pixel('https://nandomoreira.dev/lab/forja', 'HEAD');
    expect(hits).toEqual([]);
  });

  it('stops recording past the limit but keeps answering', async () => {
    const { hits, pixel } = setup(2);
    for (let i = 0; i < 4; i += 1) expect((await pixel('https://nandomoreira.dev/lab/forja')).status).toBe(200);
    expect(hits).toHaveLength(2);
  });

  it('still answers the GIF when the page list cannot be loaded', async () => {
    const hits: Hit[] = [];
    const response = await handlePixel(
      new Request('https://nandomoreira.dev/v.gif', { headers: { referer: 'https://nandomoreira.dev/lab/forja' } }),
      {
        recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) },
        limiter: createLimiter({ max: 30, windowMs: 60_000 }),
        knownPaths: () => Promise.reject(new Error('content store down')),
        ownHosts: OWN_HOSTS,
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/gif');
    expect(hits).toEqual([]);
  });
});
