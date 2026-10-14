import { describe, expect, it } from 'vitest';
import { mcpCalls } from '../../src/lib/analytics/mcp-usage';

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
