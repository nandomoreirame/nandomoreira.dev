import { describe, expect, it } from 'vitest';
import { mcpCalls, recordMcpUsage } from '../../src/lib/analytics/mcp-usage';
import type { Hit } from '../../src/lib/analytics/recorder';

describe('mcpCalls', () => {
  it('reads method and tool name, never the arguments', () => {
    const calls = mcpCalls(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'get_project', arguments: { slug: 'secret' } } }),
    );
    expect(calls).toEqual([{ method: 'tools/call', tool: 'get_project' }]);
    expect(JSON.stringify(calls)).not.toContain('secret');
  });

  it('reads the client name from initialize, capped at 64', () => {
    const calls = mcpCalls(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { clientInfo: { name: `claude-code${'x'.repeat(80)}` } } }),
    );
    expect(calls[0]?.client).toHaveLength(64);
  });

  it('counts each message of a batch, at most 20', () => {
    const batch = Array.from({ length: 25 }, (_, id) => ({ jsonrpc: '2.0', id, method: 'tools/list' }));
    expect(mcpCalls(JSON.stringify(batch))).toHaveLength(20);
  });

  it('returns nothing for invalid JSON or a message without a method', () => {
    expect(mcpCalls('{nope')).toEqual([]);
    expect(mcpCalls(JSON.stringify({ jsonrpc: '2.0', id: 1, result: {} }))).toEqual([]);
  });
});

describe('recordMcpUsage', () => {
  const post = (body: unknown) =>
    new Request('https://nandomoreira.dev/api/mcp', { method: 'POST', body: JSON.stringify(body) });

  const fake = (active: boolean) => {
    const batches: Hit[][] = [];
    return { batches, recorder: { active: () => active, recordAll: async (_request: Request, hits: readonly Hit[]) => void batches.push([...hits]) } };
  };

  it('records every message of a request in one write, leaving the body for the transport', async () => {
    const { batches, recorder } = fake(true);
    const request = post([
      { jsonrpc: '2.0', id: 1, method: 'tools/list' },
      { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'get_profile' } },
    ]);

    await recordMcpUsage(request, recorder);

    expect(batches).toHaveLength(1);
    expect(batches[0]!.map((hit) => hit.conversion)).toEqual([
      { type: 'mcp', target: 'tools/list' },
      { type: 'mcp', target: 'tools/call', tool: 'get_profile' },
    ]);
    expect(request.bodyUsed).toBe(false);
  });

  it('does not read the body when nothing would be recorded', async () => {
    const { batches, recorder } = fake(false);
    const request = post({ jsonrpc: '2.0', id: 1, method: 'ping' });

    await recordMcpUsage(request, recorder);

    expect(batches).toEqual([]);
  });

  it('records nothing for a GET or a body without calls', async () => {
    const { batches, recorder } = fake(true);
    await recordMcpUsage(new Request('https://nandomoreira.dev/api/mcp'), recorder);
    await recordMcpUsage(post({ jsonrpc: '2.0', id: 1, result: {} }), recorder);
    expect(batches).toEqual([]);
  });
});
