import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AgentBrief from '../../src/components/contact/AgentBrief.astro';
import Contato from '../../src/pages/contato.astro';
import Home from '../../src/pages/index.astro';
import Mcp from '../../src/pages/mcp.astro';
import Privacidade from '../../src/pages/privacidade.astro';
import Sobre from '../../src/pages/sobre.astro';

/**
 * compressHTML drops a line break that sits between text and an inline
 * element, so "faz um\n<code>" renders as "faz um<code>" and reads as one
 * word. The fix is an explicit {' '}; this catches the next one.
 */
const GLUED = /[\p{L}\p{N}][.,;:]?<(a|code|strong|em)\b|<\/(a|code|strong|em)>\p{L}/u;

const visibleBody = (html: string) =>
  html
    .slice(html.indexOf('<body'))
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/g, '');

describe('inline spacing survives HTML compression', () => {
  it.each([
    ['/', Home],
    ['/sobre', Sobre],
    ['/contato', Contato],
    ['/mcp', Mcp],
    ['/privacidade', Privacidade],
  ])('%s has no word glued to a link or code', async (_path, page) => {
    const container = await AstroContainer.create();
    const html = visibleBody(
      await container.renderToString(page as never, {
        request: new Request('https://nandomoreira.dev/'),
      }),
    );
    expect(html.match(GLUED)?.[0] ?? null).toBeNull();
  });

  it('AgentBrief keeps the space before the AGENTS.md link', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(AgentBrief, { props: { brief: 'x' } });
    expect(html).toMatch(/está em <a/);
  });

  it('proves the gate can fail', () => {
    expect('faz um<code>POST</code>').toMatch(GLUED);
    expect('faz um <code>POST</code>, descrito').not.toMatch(GLUED);
  });
});
