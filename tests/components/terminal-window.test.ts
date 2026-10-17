import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import TerminalWindow from '../../src/components/ui/TerminalWindow.astro';

const render = async (props: Record<string, unknown> = {}, slots: Record<string, string> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(TerminalWindow, {
    props: { filename: 'AGENTS.md', ...props },
    slots: { default: '<pre>body</pre>', ...slots },
  });
};

describe('TerminalWindow', () => {
  it('names the file in mono on its title bar', async () => {
    const html = await render();
    const bar = html.match(/<div[^>]*data-terminal-bar[^>]*>[\s\S]*?AGENTS\.md/)?.[0] ?? '';

    expect(bar).toContain('font-mono');
  });

  it('draws three window dots, hidden from screen readers', async () => {
    const html = await render();
    const dots = html.match(/<span[^>]*data-terminal-dot[^>]*>/g) ?? [];

    expect(dots).toHaveLength(3);
    for (const dot of dots) expect(dot).toContain('rounded-full');
    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>\s*<span[^>]*data-terminal-dot/);
  });

  it('recesses the body below the canvas, inside the 8px radius', async () => {
    const html = await render();

    expect(html).toMatch(/^\s*<div[^>]*class="[^"]*\brounded-lg\b[^"]*\bborder\b/);
    expect(html).toContain('<pre>body</pre>');
  });

  it('puts the actions slot at the end of the title bar', async () => {
    const html = await render({}, { actions: '<button>Copiar</button>' });
    const bar = html.match(/<div[^>]*data-terminal-bar[^>]*>[\s\S]*?<\/div>/)?.[0] ?? '';

    expect(bar.indexOf('AGENTS.md')).toBeLessThan(bar.indexOf('<button>Copiar</button>'));
  });
});
