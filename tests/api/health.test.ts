import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { GET } from '../../src/pages/api/health';

const invoke = () => GET({} as unknown as APIContext);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('GET /api/health', () => {
  it('responds 200 with a JSON content type', async () => {
    const response = await invoke();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('forbids caching, so an edge cache cannot fake a live response', async () => {
    const response = await invoke();

    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('reports the moment the request was served', async () => {
    const body = await (await invoke()).json();

    expect(body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(body.renderedAt))).toBe(false);
  });

  it('returns a different payload on a later call, which static output cannot do', async () => {
    const first = await (await invoke()).json();
    await sleep(5);
    const second = await (await invoke()).json();

    expect(second.renderedAt).not.toBe(first.renderedAt);
  });
});
