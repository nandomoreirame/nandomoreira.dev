import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import McpPage from '../../src/components/pages/McpPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(McpPage, {
    props: { locale },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en/mcp' : 'https://nandomoreira.dev/mcp'),
  });

describe('McpPage', () => {
  it('keeps the pt-BR mcp page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/mcp.pt.html');
  });

  it('renders the English mcp page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"@type":"HowTo"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the mcp body inside <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(ptLeftovers(main)).toEqual([]);
  });
});
