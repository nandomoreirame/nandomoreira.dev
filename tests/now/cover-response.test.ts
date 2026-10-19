import { describe, expect, it, vi } from 'vitest';
import { serveCover } from '../../src/lib/now/cover-response';

const HEX = 'ab67616d00001e02' + 'a'.repeat(24);
const UPSTREAM = `https://i.scdn.co/image/${HEX}`;

const asFetch = (impl: ReturnType<typeof vi.fn>): typeof fetch => impl as unknown as typeof fetch;

describe('serveCover', () => {
  it('answers 404 for an invalid id and does not call fetch', async () => {
    const fetchImpl = vi.fn();
    const response = await serveCover({ source: 'spotify', id: 'not-hex', fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns a jpeg with the long cache and nosniff, and drops set-cookie', async () => {
    const body = new Uint8Array([0xff, 0xd8, 0xff]);
    const fetchImpl = vi.fn(
      async () =>
        new Response(body, {
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'set-cookie': 'sid=1' },
        }),
    );

    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(fetchImpl).toHaveBeenCalledWith(UPSTREAM, expect.objectContaining({ redirect: 'error' }));
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(body);
    expect(response.headers.get('content-type')).toBe('image/jpeg');
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400, s-maxage=604800, immutable');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('answers 404 when the origin is html, even if it sets a cookie', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response('<html></html>', {
          status: 200,
          headers: { 'content-type': 'text/html', 'set-cookie': 'sid=1' },
        }),
    );
    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.text()).toBe('');
  });

  it('answers 404 when content-length is above 512 KB', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'content-length': '600000' },
        }),
    );
    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
  });

  it('answers 404 when the body exceeds 512 KB and content-length is absent', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(600 * 1024));
        controller.close();
      },
    });
    const origin = new Response(stream, { status: 200, headers: { 'content-type': 'image/jpeg' } });
    expect(origin.headers.get('content-length')).toBeNull();
    const fetchImpl = vi.fn(async () => origin);

    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });

  it('answers 404 when the origin answers 404', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
  });

  it('answers 404 when fetch rejects', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('down');
    });
    const response = await serveCover({ source: 'spotify', id: HEX, fetch: asFetch(fetchImpl) });

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('public, max-age=300');
  });
});
