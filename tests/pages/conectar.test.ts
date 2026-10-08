import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { MCP_TOOLS } from '../../src/lib/mcp/catalog';
import Conectar from '../../src/pages/conectar.astro';

const source = readFileSync('src/pages/conectar.astro', 'utf8');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Conectar);
};

describe('/conectar', () => {
  it('opens like every other page: eyebrow, the claim, the lead', async () => {
    const html = await render();
    expect(html).toContain('Este site fala MCP');
    expect(html).toContain('data-page-lead');
    expect(html.match(/<h1/g)).toHaveLength(1);
  });

  it('shows the MCP endpoint, selectable in one click and with no copy script', async () => {
    const html = await render();
    expect(html).toContain('https://nandomoreira.dev/api/mcp');
    expect(html).toMatch(/select-all[^>]*>[^<]*https:\/\/nandomoreira\.dev\/api\/mcp/);
  });

  it('lists every tool the server registers, read from the same catalog', async () => {
    const html = await render();
    for (const tool of MCP_TOOLS) expect(html).toContain(tool.name);
    expect(source).toContain('MCP_TOOLS');
  });

  it('explains how to connect from Claude Code, Claude, ChatGPT and any MCP client', async () => {
    const html = await render();
    expect(html).toContain('claude mcp add --transport http');
    for (const client of ['Claude Code', 'Claude', 'ChatGPT', 'Qualquer cliente MCP']) {
      expect(html).toContain(client);
    }
  });

  it('points to the briefing endpoint and to the agent guide', async () => {
    const html = await render();
    expect(html).toContain('/api/hire');
    expect(html).toContain('href="/AGENTS.md"');
  });

  it('uses no framework island', () => {
    expect(source).not.toContain('client:');
  });
});
