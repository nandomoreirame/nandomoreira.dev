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

  it('shows the availability in the AGENTS.md column, above the brief', async () => {
    const html = await render();
    const box = html.match(/<div[^>]*data-contact-availability[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';
    const open = box.match(/^<div[^>]*>/)?.[0] ?? '';
    expect(open).toContain('data-availability-card');
    expect(box).toContain('data-status-dot');
    expect(box).toMatch(/Disponível para novos projetos|Disponibilidade limitada|Indisponível no momento/);

    const column = html.match(/<div class="[^"]*\blg:col-span-3\b[^"]*">[\s\S]*?id="agent-brief"/)?.[0] ?? '';
    expect(column).toContain('data-contact-availability');
    expect(column.indexOf('data-contact-availability')).toBeLessThan(column.indexOf('id="agent-brief"'));
    expect(html.indexOf('id="form-heading"')).toBeLessThan(html.indexOf('data-contact-availability'));
  });

  it('puts the status dot on the same line as the availability title', async () => {
    const html = await render();
    const titleRow = html.match(/<span[^>]*data-availability-title[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(titleRow).toContain('items-center');
    expect(titleRow).toContain('data-status-dot');
    expect(titleRow).toMatch(/Disponível para novos projetos|Disponibilidade limitada|Indisponível no momento/);
  });

  it('gives the AGENTS.md column the wider share, with the form narrower', async () => {
    const html = await render();
    const formCard = html.match(/<section[^>]*class="[^"]*"[^>]*aria-labelledby="form-heading"|<section[^>]*aria-labelledby="form-heading"[^>]*class="[^"]*"/)?.[0] ?? '';
    expect(formCard).toContain('lg:col-span-2');
    expect(html).toMatch(/<div class="[^"]*\blg:col-span-3\b[^"]*">[\s\S]*?id="agent-brief"/);
  });

  it('stacks every form field, one below the other', async () => {
    const html = await render();
    const form = html.match(/<form[\s\S]*?<\/form>/)?.[0] ?? '';
    expect(form).not.toMatch(/\bsm:grid-cols-2\b/);
  });

  it('stacks the form title over the required-fields note, so the narrow card never squeezes it', async () => {
    const html = await render();
    const row = html.match(/<div class="([^"]*)">\s*<h2[^>]*id="form-heading"/)?.[1] ?? '';
    expect(row).toContain('flex-col');
    expect(row).not.toMatch(/\bsm:flex-row\b/);
  });

  it('titles the form card "Formulário de contato"', async () => {
    const html = await render();
    expect(html).toMatch(/<h2[^>]*id="form-heading"[^>]*>\s*Formulário de contato\s*<\/h2>/);
    expect(html).not.toContain('Iniciar uma conversa');
  });

  it('keeps the message field about a quarter shorter, at four rows', async () => {
    const textarea = (await render()).match(/<textarea[^>]*id="contato-mensagem"[^>]*>/)?.[0] ?? '';
    expect(textarea).toMatch(/\brows="4"/);
  });
});
