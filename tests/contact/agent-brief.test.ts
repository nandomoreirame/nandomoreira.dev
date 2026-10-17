import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AgentBrief from '../../src/components/contact/AgentBrief.astro';

const render = async () => {
  const container = await AstroContainer.create();
  return container.renderToString(AgentBrief, {
    props: { brief: '# AGENTS.md: hire X\nPOST https://nandomoreira.dev/api/hire\n{"from":"a"}' },
  });
};

describe('AgentBrief', () => {
  it('is a labelled section with the pt-BR pitch', async () => {
    const html = await render();
    expect(html).toMatch(/<section[^>]*aria-labelledby="agents-heading"/);
    expect(html).toMatch(/<h2[^>]*id="agents-heading"[^>]*>[\s\S]*?pelo seu agent/);
  });

  it('shows the brief as code, escaped, with its text intact under the highlight', async () => {
    const html = await render();
    const code = html.match(/<code[^>]*id="agent-brief"[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '';
    const textContent = code.replace(/<[^>]+>/g, '');

    expect(textContent).toContain('POST https://nandomoreira.dev/api/hire');
    expect(textContent).toContain('{&quot;from&quot;:&quot;a&quot;}');
    expect(code).not.toMatch(/"from"/);
  });

  it('highlights the brief with token colours on the server', async () => {
    const code = (await render()).match(/<code[^>]*id="agent-brief"[^>]*>([\s\S]*?)<\/code>/)?.[1] ?? '';

    expect(code).toMatch(/<span class="text-primary"># AGENTS\.md: hire X<\/span>/);
    expect(code).toMatch(/<span class="text-success">POST<\/span>/);
  });

  it('offers a Copy button wired to the brief, hidden until the script runs', async () => {
    const html = await render();
    const button = html.match(/<button[^>]*data-copy="agent-brief"[^>]*>/)?.[0] ?? '';
    expect(button).toContain('hidden');
    expect(button).toContain('type="button"');
    expect(button).toContain('data-label-copied="Copiado"');
  });

  it('sets the pitch heading in the editorial serif at its regular weight (Terminal Noir)', async () => {
    const h2 = (await render()).match(/<h2[^>]*id="agents-heading"[^>]*>/)?.[0] ?? '';
    expect(h2).toContain('font-serif');
    expect(h2).toContain('text-h1');
    expect(h2).toContain('font-normal');
    expect(h2).not.toContain('font-semibold');
  });

  it('links the full AGENTS.md for whoever has no clipboard', async () => {
    expect(await render()).toMatch(/<a[^>]*href="\/AGENTS\.md"/);
  });

  it('wraps long lines inside the panel instead of scrolling sideways', async () => {
    const pre = (await render()).match(/<pre[^>]*class="([^"]*)"/)?.[1] ?? '';
    expect(pre).toMatch(/\bwhitespace-pre-wrap\b/);
    expect(pre).toMatch(/\bwrap-anywhere\b/);
  });
});

describe('AgentBrief placement', () => {
  it.each(['src/pages/index.astro', 'src/pages/contato.astro'])('%s renders the brief from buildHireBrief', async (file) => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(file, 'utf8');
    expect(source).toContain('<AgentBrief');
    expect(source).toContain('buildHireBrief(');
  });
});

describe('AgentBrief structure', () => {
  it('renders the terminal window through AgentBriefWindow in both variants', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync('src/components/contact/AgentBrief.astro', 'utf8');

    expect(source.match(/<TerminalWindow/g) ?? []).toHaveLength(0);
    expect(source.match(/<AgentBriefWindow/g) ?? []).toHaveLength(2);
  });
});
