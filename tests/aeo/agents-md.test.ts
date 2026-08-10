import { describe, expect, it } from 'vitest';
import { buildAgentsMd } from '../../src/lib/aeo/agents-md';

const site = new URL('https://nandomoreira.dev');

const profile = {
  name: 'Fernando Moreira Costa',
  headline: 'Product engineer working with AI agents',
  bio: 'I build agent tooling and AI products in production.',
  services: [
    {
      title: 'Agent tooling',
      description: 'Internal tooling for teams using coding agents.',
      caseSlug: 'forja',
    },
  ],
  availability: {
    status: 'open',
    detail: 'Open to fixed-scope consulting and to a senior position.',
    updatedAt: '2026-08-08',
  },
  contacts: [{ kind: 'email', value: 'fernando@nandomoreira.dev' }],
} as never;

const output = () => buildAgentsMd({ site, profile });

describe('buildAgentsMd', () => {
  it('states the services on offer', () => {
    expect(output()).toContain('Agent tooling');
  });

  it('links each service to the case that proves it', () => {
    expect(output()).toContain('/projetos/forja');
  });

  it('reports availability together with the date it was last updated', () => {
    const text = output();

    expect(text).toContain('open');
    expect(text).toContain('2026-08-08');
  });

  it('explains how to reach the endpoints', () => {
    const text = output();

    expect(text).toContain('/api/hire');
    expect(text).toContain('/api/mcp');
  });

  it('names every MCP tool the server actually registers', async () => {
    // Derived from the same list the server registers from: a hand-written
    // copy here is the one that falls behind (REQ-012).
    const { MCP_TOOLS } = await import('../../src/lib/mcp/catalog');
    const text = output();

    for (const tool of MCP_TOOLS) {
      expect(text, tool.name).toContain(tool.name);
    }
  });

  it('advertises both resume routes, so an agent finds them without guessing', () => {
    const text = output();

    expect(text).toContain('/api/resume.json');
    expect(text).toContain('/api/resume.txt');
  });

  it('never publishes the email address on a machine route', () => {
    expect(output()).not.toContain('@nandomoreira.dev');
  });

  it('points an agent that wants to make contact at /api/hire', () => {
    expect(output()).toMatch(/POST[\s\S]*\/api\/hire/);
  });

  it('stays in English', () => {
    expect(output()).not.toMatch(/Disponibilidade|Serviços/);
  });
});
