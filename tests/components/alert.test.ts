import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Alert from '../../src/components/ui/Alert.astro';

const render = async (props: Record<string, unknown>, body = 'Aberto a projetos.') =>
  (await AstroContainer.create()).renderToString(Alert, { props, slots: { default: body } });

describe('Alert', () => {
  it('shows the title and the message', async () => {
    const html = await render({ title: 'Disponibilidade' });
    expect(html).toContain('Disponibilidade');
    expect(html).toContain('Aberto a projetos.');
  });

  it('paints the success tone from the tokens, never a loose colour', async () => {
    const html = await render({ title: 'Disponibilidade', tone: 'success' });
    const root = html.match(/<div[^>]*data-alert[^>]*>/)?.[0] ?? '';
    expect(root).toContain('data-tone="success"');
    expect(root).toContain('border-success/40');
    expect(root).toContain('bg-success/10');
    expect(html).toMatch(/<strong[^>]*text-success[^>]*>Disponibilidade<\/strong>/);
  });

  it('defaults to the success tone', async () => {
    expect(await render({ title: 'T' })).toContain('data-tone="success"');
  });

  it('carries the meaning in words, with the icon hidden from screen readers', async () => {
    const html = await render({ title: 'Disponibilidade' });
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it('keeps the message out of a <p>, so Prose does not push it down', async () => {
    const html = await render({ title: 'Disponibilidade' });
    expect(html).not.toMatch(/<p\b/);
  });
});
