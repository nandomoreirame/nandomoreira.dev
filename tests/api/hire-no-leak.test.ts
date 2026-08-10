import { describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';

const valid = {
  from: 'Agente',
  contact: 'contato@example.com',
  brief: 'Um briefing legítimo.',
};

/** Every dependency fails, which is when a leak is most likely to escape. */
const hostile = (): Dependencies => ({
  store: {
    save: vi.fn(async () => {
      throw new Error('FirestoreError: 7 PERMISSION_DENIED on hire_requests at /home/app/src/lib/hire/store.ts:31:15');
    }),
    markNotified: vi.fn(async () => undefined),
  },
  notifier: {
    send: vi.fn(async () => {
      throw new Error('resend: 401 at /home/app/node_modules/resend/index.js:9:1');
    }),
  },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-08-10T12:00:00.000Z'),
});

const post = (body: string, method = 'POST') =>
  handleHire(
    new Request('https://nandomoreira.dev/api/hire', {
      method,
      headers: { 'content-type': 'application/json' },
      ...(method === 'GET' ? {} : { body }),
    }),
    hostile(),
  );

const FORBIDDEN: Array<[string, RegExp]> = [
  ['a stack frame', /at .+:\d+:\d+/],
  ['an absolute path', /\/home\/|src\/lib\//],
  ['a dependency path', /node_modules/],
  ['the collection name', /hire_requests/i],
  ['the driver name', /firestore|resend/i],
  ['a status code from a dependency', /PERMISSION_DENIED/],
];

const CASES: Array<[string, string, string]> = [
  ['malformed json', '{ not json', 'POST'],
  ['oversized body', 'x'.repeat(20_000), 'POST'],
  ['invalid payload', JSON.stringify({ brief: '' }), 'POST'],
  ['unknown key', JSON.stringify({ ...valid, extra: 'x' }), 'POST'],
  ['persistence failure', JSON.stringify(valid), 'POST'],
  ['wrong method', '', 'GET'],
];

describe('no response leaks an internal detail', () => {
  it.each(FORBIDDEN)('never exposes %s', async (_label, pattern) => {
    for (const [name, body, method] of CASES) {
      const text = await (await post(body, method)).text();

      expect(text, name).not.toMatch(pattern);
    }
  });

  it('still says something useful, rather than an empty body', async () => {
    for (const [name, body, method] of CASES) {
      const parsed = await (await post(body, method)).json();

      expect(parsed.error ?? parsed.message, name).toBeTruthy();
    }
  });

  it('proves the gate can fail', () => {
    // One sample per pattern: a single string that matched only some of them
    // would leave the unmatched patterns unproven.
    const leaks: Record<string, string> = {
      'a stack frame': 'at handler (index.js:12:9)',
      'an absolute path': '/home/app/src/lib/hire/store.ts',
      'a dependency path': '/app/node_modules/resend/index.js',
      'the collection name': 'writing to hire_requests failed',
      'the driver name': 'FirestoreError: unavailable',
      'a status code from a dependency': '7 PERMISSION_DENIED',
    };

    for (const [label, pattern] of FORBIDDEN) {
      expect(leaks[label], label).toMatch(pattern);
    }
  });
});
