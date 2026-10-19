import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AvailabilityCard from '../../src/components/ui/AvailabilityCard.astro';

const render = async (status: 'open' | 'limited' | 'closed', detail = 'Aberto a projetos de escopo fechado.') => {
  const container = await AstroContainer.create();
  return container.renderToString(AvailabilityCard, { props: { status, detail } });
};

describe('AvailabilityCard', () => {
  it('puts the status dot beside the label, with the detail underneath', async () => {
    const html = await render('open');
    const title = html.match(/<span[^>]*data-availability-title[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(title).toContain('data-status-dot');
    expect(title).toContain('Disponível para novos projetos');
    expect(html.indexOf('data-availability-title')).toBeLessThan(html.indexOf('Aberto a projetos de escopo fechado.'));
  });

  it('labels every status in text, never by colour alone', async () => {
    expect(await render('limited')).toContain('Disponibilidade limitada');
    expect(await render('closed')).toContain('Indisponível no momento');
  });

  it('links the whole card to /servicos while open, with the invitation underneath', async () => {
    const html = await render('open');
    expect(html).toMatch(/<a[^>]*href="\/servicos"[^>]*data-availability-card/);
    expect(html).toContain('Veja o que posso fazer por você');
    expect(html).toContain('lucide:arrow-right');
    expect(html).toMatch(/focus-visible:outline-primary/);
  });

  it('reads in three levels: status eyebrow, invitation headline, muted detail', async () => {
    const html = await render('open');
    const title = html.match(/<span[^>]*data-availability-title[^>]*>/)?.[0] ?? '';
    expect(title).toMatch(/font-mono/);
    expect(title).toMatch(/uppercase/);
    expect(html).toMatch(
      /<span[^>]*class="[^"]*\btext-h3\b[^"]*\bfont-medium\b[^"]*"[^>]*>\s*Veja o que posso fazer por você/,
    );
    expect(html.indexOf('data-availability-title')).toBeLessThan(html.indexOf('Veja o que posso fazer por você'));
    expect(html.indexOf('Veja o que posso fazer por você')).toBeLessThan(html.indexOf('Aberto a projetos'));
  });

  it('never takes the underline a Prose parent puts on links', async () => {
    const tag = (await render('open')).match(/<a[^>]*data-availability-card[^>]*>/)?.[0] ?? '';
    expect(tag).toMatch(/\bno-underline!/);
  });

  it('stays a plain box when closed: no invitation to hire', async () => {
    const html = await render('closed');
    expect(html).not.toContain('href="/servicos"');
    expect(html).not.toContain('Veja o que posso fazer por você');
  });

  it('rests on the strong grey border and lights it in primary on hover', async () => {
    const tag = (await render('open')).match(/<a[^>]*data-availability-card[^>]*>/)?.[0] ?? '';
    expect(tag).toMatch(/(?<=["\s])border-border-strong\b/);
    expect(tag).toMatch(/\bhover:border-primary\b/);
    expect(tag).not.toMatch(/hover:border-border-strong/);
  });

  it('takes a compact detail size for a narrow column (/contato), small by default', async () => {
    const detail = (html: string) => html.match(/<span[^>]*>Aberto a projetos de escopo fechado\.<\/span>/)?.[0] ?? '';
    expect(detail(await render('open'))).toMatch(/\btext-small\b/);
    const container = await AstroContainer.create();
    const compact = await container.renderToString(AvailabilityCard, {
      props: { status: 'open', detail: 'Aberto a projetos de escopo fechado.', compact: true },
    });
    expect(detail(compact)).toMatch(/\btext-caption\b/);
    expect(detail(compact)).not.toMatch(/\btext-small\b/);
  });

  it('is a hairline box on surface, like the /contato block', async () => {
    expect(await render('open')).toMatch(
      /<(?:a|div)[^>]*data-availability-card[^>]*class="[^"]*\bborder-border(?:-strong)?\b[^"]*\bbg-surface\b/,
    );
  });
});
