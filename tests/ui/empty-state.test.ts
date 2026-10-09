import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import EmptyState from '../../src/components/ui/EmptyState.astro';

const render = async (props: Record<string, unknown>, slots: Record<string, string> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(EmptyState, { props, slots });
};

describe('EmptyState', () => {
  it('centres an icon, a heading and a description', async () => {
    const html = await render({ icon: 'lucide:mail-check', title: 'Mensagem enviada', description: 'Já chegou.' });

    expect(html).toMatch(/<div[^>]*class="[^"]*\bitems-center\b[^"]*\btext-center\b/);
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"[^>]*data-icon="lucide:mail-check"|<svg[^>]*data-icon="lucide:mail-check"[^>]*aria-hidden="true"/);
    expect(html).toMatch(/<h2[^>]*>Mensagem enviada<\/h2>/);
    expect(html).toContain('Já chegou.');
  });

  it('passes id and role through, so it can be a live status region and an anchor', async () => {
    const html = await render({ icon: 'lucide:inbox', title: 'T', description: 'D', id: 'envio', role: 'status' });
    expect(html).toMatch(/<div[^>]*id="envio"/);
    expect(html).toMatch(/<div[^>]*role="status"/);
  });

  it('renders actions from the default slot', async () => {
    const html = await render({ icon: 'lucide:inbox', title: 'T', description: 'D' }, { default: '<a href="/x">Ação</a>' });
    expect(html).toContain('<a href="/x">Ação</a>');
  });
});
