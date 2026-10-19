import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FloatingActions from '../../src/components/sales/FloatingActions.astro';
import SalesLayout from '../../src/layouts/SalesLayout.astro';

const render = async () => (await AstroContainer.create()).renderToString(FloatingActions);

describe('FloatingActions', () => {
  it('links WhatsApp through /go, in a new tab, with a name and a visible hint', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="\/go\/contato\/whatsapp"[^>]*target="_blank"[^>]*rel="noopener"/);
    expect(html).toContain('aria-label="Fale comigo no WhatsApp"');
    expect(html).toContain('>Fale comigo no WhatsApp</span>');
  });

  it('goes back to the top without a script', async () => {
    const html = await render();
    expect(html).toMatch(/<a[^>]*href="#topo"[^>]*aria-label="Voltar ao topo"/);
    expect(html).not.toContain('<script');
    const backToTop = html.match(/<a[^>]*href="#topo"[^>]*>/)?.[0] ?? '';
    expect(backToTop).toContain('hover:border-primary');
    expect(backToTop).not.toContain('hover:border-border-strong');
  });

  it('keeps both targets at 44px with a visible focus ring', async () => {
    const links = (await render()).match(/<a[^>]*>/g) ?? [];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain('size-11');
      expect(link).toContain('focus-visible:outline-2');
    }
  });

  it('is on every sales page, with the #topo anchor at the top', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SalesLayout, {
      props: { title: 'T', description: 'D' },
      slots: { default: '<h1>T</h1>' },
      request: new Request('https://nandomoreira.dev/servicos'),
    });
    expect(html).toContain('aria-label="Voltar ao topo"');
    expect(html.indexOf('id="topo"')).toBeLessThan(html.indexOf('<header'));
  });
});
