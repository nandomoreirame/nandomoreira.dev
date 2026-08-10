import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { ALL } from '../../src/pages/api/mcp';

const request = (body: string, headers: Record<string, string> = {}) =>
  ALL({
    request: new Request('https://nandomoreira.dev/api/mcp', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
        ...headers,
      },
      body,
    }),
  } as unknown as APIContext);

const NEVER_LEAKED: Array<[string, RegExp]> = [
  ['a stack frame', /at .+\(.+:\d+:\d+\)/],
  ['an absolute path', /\/home\/|\/var\/|src\/lib\//],
  ['a dependency path', /node_modules/],
  ['an e-mail address', /[\w.+-]+@[\w-]+\.[\w.]+/],
];

describe('malformed input', () => {
  it('answers a malformed body with a JSON-RPC error, not a crash', async () => {
    const response = await request('{ not json');
    const body = await response.json();

    expect(body.error).toBeDefined();
    expect(body.error.code).toEqual(expect.any(Number));
  });

  it('answers an empty body with an error rather than a 500', async () => {
    const response = await request('');

    expect(response.status).toBeLessThan(500);
  });

  it('rejects an unacceptable Accept header as a protocol error', async () => {
    const response = await request(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }), {
      accept: 'text/csv',
    });

    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(response.status).toBeLessThan(500);
  });

  it.each(NEVER_LEAKED)('never leaks %s', async (_label, pattern) => {
    const read = async (body: string) => (await request(body)).text();

    const bodies = await Promise.all([
      read('{ not json'),
      read(''),
      read('{"jsonrpc":"2.0","id":1,"method":"nope/nope"}'),
    ]);

    for (const body of bodies) {
      expect(body).not.toMatch(pattern);
    }
  });

  it('proves the gate can fail', () => {
    expect('at fn (/home/user/src/lib/x.ts:1:1)').toMatch(NEVER_LEAKED[0][1]);
  });
});
