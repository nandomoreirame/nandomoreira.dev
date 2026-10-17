import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AgentBrief from '../../src/components/contact/AgentBrief.astro';
import Contato from '../../src/pages/contato.astro';

describe('AgentBrief panel variant', () => {
  it('renders only the terminal window, without the pitch column', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AgentBrief, { props: { brief: '# AGENTS.md', variant: 'panel' } });
    expect(html).not.toContain('agents-heading');
    expect(html).toContain('data-terminal-bar');
    expect(html).toContain('id="agent-brief"');
  });
});

describe('/contato layout', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Contato);
  };

  it('splits form and machine contact into two columns from lg, form first', async () => {
    const html = await render();
    expect(html).toMatch(/class="[^"]*\bgrid\b[^"]*\blg:grid-cols-5\b/);
    expect(html.indexOf('<form')).toBeLessThan(html.indexOf('id="agent-brief"'));
  });

  it('offers the MCP URL with a Copy button wired to it', async () => {
    const html = await render();
    expect(html).toMatch(/<code[^>]*id="mcp-url"[^>]*>https:\/\/nandomoreira\.dev\/api\/mcp<\/code>/);
    expect(html).toMatch(/<button[^>]*data-copy="mcp-url"/);
  });

  it('shows the availability with its dot and detail inside the form card', async () => {
    const html = await render();
    const box = html.match(/<div[^>]*data-contact-availability[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(box).toContain('data-status-dot');
    expect(box).toMatch(/Disponível para novos projetos|Disponibilidade limitada|Indisponível no momento/);
  });
});
