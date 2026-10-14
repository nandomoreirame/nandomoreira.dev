import { describe, expect, it } from 'vitest';
import { measureRequest } from '../../src/lib/analytics/measure';
import type { Hit } from '../../src/lib/analytics/recorder';

const spy = () => {
  const hits: Hit[] = [];
  return { hits, recorder: { record: async (_request: Request, hit: Hit) => void hits.push(hit) } };
};

const run = async (path: string, init: { prerendered?: boolean; contentType?: string; status?: number } = {}) => {
  const { hits, recorder } = spy();
  const url = new URL(`https://nandomoreira.dev${path}?utm_source=x&ignored=1`);
  await measureRequest(recorder, {
    request: new Request(url, { headers: { referer: 'https://www.google.com/' } }),
    url,
    isPrerendered: init.prerendered ?? false,
    response: new Response('', {
      status: init.status ?? 200,
      headers: { 'content-type': init.contentType ?? 'text/html' },
    }),
  });
  return hits;
};

describe('measureRequest', () => {
  it('records an SSR page with its referrer and query', async () => {
    const [hit] = await run('/sobre');
    expect(hit).toMatchObject({ kind: 'pageview', path: '/sobre', source: 'ssr', referrer: 'https://www.google.com/' });
    expect(hit?.search?.get('utm_source')).toBe('x');
  });

  it('normalises the trailing slash', async () => {
    expect((await run('/sobre/'))[0]?.path).toBe('/sobre');
  });

  it('records machine surfaces as machine', async () => {
    expect((await run('/llms.txt', { contentType: 'text/plain' }))[0]?.kind).toBe('machine');
  });

  it('leaves prerendered pages to the pixel, so nothing counts twice', async () => {
    expect(await run('/lab/forja', { prerendered: true })).toEqual([]);
  });

  it('ignores a 404', async () => {
    expect(await run('/nada', { status: 404 })).toEqual([]);
  });
});
