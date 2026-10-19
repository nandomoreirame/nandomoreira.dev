import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CommandPalette from '../../src/components/search/CommandPalette.astro';
import BaseLayout from '../../src/layouts/BaseLayout.astro';
import SalesLayout from '../../src/layouts/SalesLayout.astro';
import Sobre from '../../src/pages/sobre.astro';

describe('CommandPalette markup', () => {
  it('is a labelled dialog with a combobox bound to a listbox and a live region', async () => {
    const html = await (await AstroContainer.create()).renderToString(CommandPalette);
    expect(html).toMatch(/<dialog[^>]*data-command-palette[^>]*aria-label="Buscar no site"/);
    expect(html).toMatch(/<input[^>]*role="combobox"[^>]*aria-controls="palette-list"[^>]*aria-expanded="true"/);
    expect(html).toMatch(/<ul[^>]*id="palette-list"[^>]*role="listbox"/);
    expect(html).toMatch(/aria-live="polite"/);
    expect(html).toContain('placeholder="Digite um comando ou busque…"');
    // Every free-text field on the site is bounded (tests/pages/contato.test.ts).
    expect(html).toMatch(/<input[^>]*role="combobox"[^>]*maxlength="\d+"/);
  });

  it('names the combobox and shows a visible focus indicator on it', async () => {
    const html = await (await AstroContainer.create()).renderToString(CommandPalette);
    const input = html.match(/<input[^>]*role="combobox"[^>]*>/)?.[0] ?? '';
    expect(input).toContain('aria-label="Buscar no site"');
    expect(input).toContain('focus-visible:border-primary');
  });

  it('keeps a live region outside the dialog, so the copy notice survives the close', async () => {
    const html = await (await AstroContainer.create()).renderToString(CommandPalette);
    const outside = html.slice(html.indexOf('</dialog>'));
    expect(outside).toMatch(/<p[^>]*aria-live="polite"[^>]*data-palette-announce/);
  });

  it('ships on the main site, never on the sales layout', async () => {
    const container = await AstroContainer.create();
    const site = await container.renderToString(Sobre, { request: new Request('https://nandomoreira.dev/sobre') });
    expect(site).toContain('data-command-palette');
    const sales = await container.renderToString(SalesLayout, {
      props: { title: 'x', description: 'y' },
      slots: { default: '<h1>x</h1>' },
      request: new Request('https://nandomoreira.dev/servicos'),
    });
    expect(sales).not.toContain('data-command-palette');
  });

  it('hands the page markdown and AI paths to the palette where the AI switcher shows', async () => {
    const container = await AstroContainer.create();
    const site = await container.renderToString(Sobre, { request: new Request('https://nandomoreira.dev/sobre') });
    const dialog = site.match(/<dialog[^>]*>/)?.[0] ?? '';
    expect(dialog).toContain('data-palette-md="/sobre.md"');
    expect(dialog).toContain('data-palette-ai="/sobre/ia"');
    expect(dialog).not.toContain('data-palette-human');
  });

  it('points back to the human page from the AI view', async () => {
    const html = await (await AstroContainer.create()).renderToString(BaseLayout, {
      props: { title: 'Sobre', description: 'd', view: 'ai', canonicalPath: '/sobre' },
      slots: { default: '<p>x</p>' },
    });
    const dialog = html.match(/<dialog[^>]*>/)?.[0] ?? '';
    expect(dialog).toContain('data-palette-human="/sobre"');
    expect(dialog).not.toContain('data-palette-ai');
  });
});
