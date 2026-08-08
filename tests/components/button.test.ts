import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Button from '../../src/components/ui/Button.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(Button, {
    props,
    slots: { default: 'Ver projetos' },
  });
};

describe('Button', () => {
  it('renders an anchor when given an href, and a button otherwise', async () => {
    expect(await render({ href: '/projetos' })).toContain('<a');
    expect(await render()).toContain('<button');
  });

  it.each(['hover:', 'focus-visible:', 'active:', 'disabled:'])(
    'declares the %s state',
    async (state) => {
      expect(await render()).toContain(state);
    },
  );

  it('uses the accent as the focus indicator', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('meets the 44px touch target', async () => {
    expect(await render()).toContain('min-h-11');
  });

  it('never relies on the low-contrast border alone to delimit itself', async () => {
    const html = await render({ variant: 'secondary' });
    const classes = (html.match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/);
    expect(classes).toContain('border-border-strong');
    expect(classes).not.toContain('border-border');
  });

  it('keeps a disabled button readable rather than merely faded', async () => {
    const html = await render({ disabled: true });
    expect(html).toContain('disabled');
    expect(html).toContain('aria-disabled="true"');
  });
});
