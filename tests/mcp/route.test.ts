import { readFileSync } from 'node:fs';
import type { APIContext } from 'astro';
import { describe, expect, it } from 'vitest';
import { ALL } from '../../src/pages/api/mcp';

const MCP_HEADERS = {
  'content-type': 'application/json',
  accept: 'application/json, text/event-stream',
};

const initialize = {
  jsonrpc: '2.0',
  id: 1,
  method: 'initialize',
  params: {
    protocolVersion: '2025-06-18',
    capabilities: {},
    clientInfo: { name: 'test-client', version: '1.0.0' },
  },
};

const post = (body: string) =>
  ALL({
    request: new Request('https://nandomoreira.dev/api/mcp', {
      method: 'POST',
      headers: MCP_HEADERS,
      body,
    }),
  } as unknown as APIContext);

/** The transport may answer as SSE, so read the JSON out of either framing. */
const readJson = async (response: Response) => {
  const text = await response.text();
  const line = text.split('\n').find(candidate => candidate.startsWith('data: '));

  return JSON.parse(line ? line.slice('data: '.length) : text);
};

const source = readFileSync('src/pages/api/mcp.ts', 'utf8');

describe('POST /api/mcp', () => {
  it('answers an initialize request', async () => {
    const response = await post(JSON.stringify(initialize));

    expect(response.status).toBe(200);
  });

  it('declares its own name and version on the wire', async () => {
    const body = await readJson(await post(JSON.stringify(initialize)));

    expect(body.result.serverInfo.name).toBe('nandomoreira-dev');
    expect(body.result.serverInfo.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('negotiates a stable protocol revision, never a release candidate', async () => {
    const body = await readJson(await post(JSON.stringify(initialize)));

    // F6.1: the version production clients speak. 2026-07-28 is opt-in.
    expect(body.result.protocolVersion).not.toBe('2026-07-28');
    expect(body.result.protocolVersion).toMatch(/^20(2[0-5])-\d{2}-\d{2}$/);
  });

  it('emits no session id, which is what stateless mode means', async () => {
    const response = await post(JSON.stringify(initialize));

    expect(response.headers.get('mcp-session-id')).toBeNull();
  });

  it('creates a fresh transport per request', () => {
    // A module-level transport is the natural shape and the wrong one here.
    expect(source).not.toMatch(/^const transport = new/m);
    expect(source).not.toMatch(/^const server = await/m);
  });

  it('reads through the access layer, never through getCollection', () => {
    expect(source).not.toContain('getCollection(');
  });

  it('forwards every method, so a probing client is not broken', () => {
    // Exporting only POST would 404 a client that probes with GET.
    expect(source).toMatch(/export const ALL/);
  });
});
