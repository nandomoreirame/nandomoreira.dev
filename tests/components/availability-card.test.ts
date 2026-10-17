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

  it('is a hairline box on surface, like the /contato block', async () => {
    expect(await render('open')).toMatch(/<div[^>]*data-availability-card[^>]*class="[^"]*\bborder-border\b[^"]*\bbg-surface\b/);
  });
});
