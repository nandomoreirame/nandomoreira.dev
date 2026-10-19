import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { MCP_TOOLS } from '../../src/lib/mcp/catalog';
import Conectar from '../../src/pages/mcp.astro';

const source = readFileSync('src/pages/mcp.astro', 'utf8');

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(Conectar);
};

describe('/mcp', () => {
  it('opens like every other page: eyebrow, the claim, the lead', async () => {
    const html = await render();
    expect(html).toContain('Este site fala com Agentes de IA');
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

describe('/mcp copy buttons and agent brief', () => {
  const page = async () => {
    const { experimental_AstroContainer } = await import('astro/container');
    const container = await experimental_AstroContainer.create();
    return container.renderToString(Conectar, {});
  };

  it('gives the endpoint and every client snippet a copy button aimed at its own code', async () => {
    const html = await page();
    const targets = [...html.matchAll(/<button[^>]*data-copy="([^"]+)"/g)].map(m => m[1]);
    // Endpoint + four clients + the AGENTS.md brief.
    expect(targets).toHaveLength(6);
    expect(new Set(targets).size).toBe(6);
    for (const id of targets) {
      expect(html, id).toMatch(new RegExp(`<code[^>]*id="${id}"`));
    }
  });

  it('shows the copy icon on each button, hidden until the script reveals it', async () => {
    const buttons = (await page()).match(/<button[^>]*data-copy=[\s\S]*?<\/button>/g) ?? [];
    for (const button of buttons) {
      expect(button).toMatch(/<button[^>]*\bhidden\b/);
      expect(button).toContain('data-icon="lucide:copy"');
    }
  });

  it('includes the AGENTS.md brief block', async () => {
    expect(await page()).toContain('id="agent-brief"');
  });
});
