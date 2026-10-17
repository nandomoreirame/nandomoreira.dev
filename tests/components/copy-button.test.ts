import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import CopyButton from '../../src/components/ui/CopyButton.astro';

const render = async (props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(CopyButton, { props: { target: 'post-url', ...props } });

describe('CopyButton', () => {
  it('takes its own visible text, kept in the span the script swaps', async () => {
    expect(await render({ text: 'Copiar link' })).toMatch(/<span[^>]*>Copiar link<\/span>/);
  });

  it('has a compact size for toolbars, the default staying 44px', async () => {
    const compact = await render({ compact: true });
    expect(compact).toContain('min-h-8');
    expect(compact).toContain('text-caption');
    expect(await render({})).toContain('min-h-11');
  });

  it('still ships hidden, for the site script to reveal', async () => {
    expect(await render({ compact: true })).toMatch(/<button[^>]*hidden/);
  });
});
