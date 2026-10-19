import { describe, expect, it } from 'vitest';
import { closeWhenDrained } from '../../src/lib/mcp/lifecycle';

const closable = () => {
  const state = { closed: 0 };

  return {
    state,
    closable: {
      close: async () => {
        state.closed += 1;
      },
    },
  };
};

const streamed = (chunks: string[]): Response => {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
};

describe('closeWhenDrained', () => {
  it('does not close before the body has been read', async () => {
    const { state, closable: target } = closable();

    closeWhenDrained(streamed(['{"a":1}']), target);
    await Promise.resolve();

    // Closing here is the bug this exists to prevent: it tears the stream down
    // and the caller receives an empty body.
    expect(state.closed).toBe(0);
  });

  it('preserves the body exactly', async () => {
    const { closable: target } = closable();
    const response = closeWhenDrained(streamed(['{"jsonrpc":', '"2.0"}']), target);

    expect(await response.text()).toBe('{"jsonrpc":"2.0"}');
  });

  it('preserves status and headers', () => {
    const { closable: target } = closable();
    const response = closeWhenDrained(streamed(['{}']), target);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('closes once the body is fully consumed', async () => {
    const { state, closable: target } = closable();
    const response = closeWhenDrained(streamed(['{}']), target);

    await response.text();

    expect(state.closed).toBe(1);
  });

  it('closes when the consumer gives up midway', async () => {
    const { state, closable: target } = closable();
    const response = closeWhenDrained(streamed(['{', '}']), target);

    await response.body?.cancel('client went away');

    expect(state.closed).toBe(1);
  });

  it('closes a bodyless response immediately, since there is nothing to wait for', async () => {
    const { state, closable: target } = closable();

    closeWhenDrained(new Response(null, { status: 204 }), target);
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(state.closed).toBe(1);
  });

  it('never closes twice, which would throw inside the SDK', async () => {
    const { state, closable: target } = closable();
    const response = closeWhenDrained(streamed(['{}']), target);

    await response.text();
    await response.body?.cancel().catch(() => undefined);

    expect(state.closed).toBe(1);
  });

  it('still closes when the source stream errors', async () => {
    const { state, closable: target } = closable();
    const broken = new Response(
      new ReadableStream({
        start(controller) {
          controller.error(new Error('upstream died'));
        },
      }),
    );

    await expect(closeWhenDrained(broken, target).text()).rejects.toThrow();

    expect(state.closed).toBe(1);
  });
});
