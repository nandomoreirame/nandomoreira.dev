import { describe, expect, it } from 'vitest';
import { MCP_SERVER_INFO, createMcpServer } from '../../src/lib/mcp/server';

describe('createMcpServer', () => {
  it('returns a new server on every call, never a shared singleton', async () => {
    const a = await createMcpServer();
    const b = await createMcpServer();

    // Stateless mode collides request IDs across concurrent clients when the
    // server instance is shared, and this backend serves with concurrency 80.
    expect(a).not.toBe(b);
  });

  it('declares its own name and version, so a client records what it spoke to', () => {
    expect(MCP_SERVER_INFO.name).toBe('nandomoreira-dev');
    expect(MCP_SERVER_INFO.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('takes the declared version from the package, not from a second literal', async () => {
    const { version } = await import('../../package.json');

    expect(MCP_SERVER_INFO.version).toBe(version);
  });

  it('registers no write tool: the only write surface is /api/hire', async () => {
    const server = await createMcpServer();
    const names = Object.keys((server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools);

    expect(names.some(name => /^(create|update|delete|send|post)_/.test(name))).toBe(false);
  });
});
