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

  it('lights the amber halo on hover, on the primary variant only', async () => {
    const classes = async (variant: string) =>
      ((await render({ variant })).match(/class="([^"]*)"/)?.[1] ?? '').split(/\s+/);

    expect(await classes('primary')).toContain('hover:shadow-glow');
    expect(await classes('secondary')).not.toContain('hover:shadow-glow');
    expect(await classes('ghost')).not.toContain('hover:shadow-glow');
  });

  it('adds a trailing arrow on request, hidden from screen readers, that moves on hover', async () => {
    const html = await render({ arrow: true });
    const arrow = html.match(/<svg[^>]*data-icon="lucide:arrow-right"[^>]*>/)?.[0] ?? '';

    expect(arrow).toContain('aria-hidden="true"');
    expect(arrow).toMatch(/group-hover\/button:translate-x-/);
    expect(html.indexOf('Ver projetos')).toBeLessThan(html.indexOf('lucide:arrow-right'));
    expect(await render()).not.toContain('lucide:arrow-right');
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

  it('drops href on a disabled link so it is not navigable', async () => {
    const html = await render({ href: '/projetos', disabled: true });
    expect(html).toMatch(/<a\b/);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain('role="link"');
    expect(html).not.toMatch(/\bhref=/);
    expect(html).toContain('cursor-not-allowed');
    expect(html).toContain('opacity-60');
  });

  it('keeps href on an enabled link', async () => {
    const html = await render({ href: '/projetos' });
    expect(html).toContain('href="/projetos"');
    expect(html).not.toContain('aria-disabled');
  });

  it.each(['primary', 'secondary', 'ghost'] as const)(
    'emits no hover: or active: class on a disabled %s link',
    async (variant) => {
      const html = await render({ href: '/projetos', disabled: true, variant });
      const classes = html.match(/class="([^"]*)"/)?.[1] ?? '';
      expect(classes).not.toContain('hover:');
      expect(classes).not.toContain('active:');
    },
  );

  it('still emits hover: classes on an enabled link', async () => {
    const html = await render({ href: '/projetos' });
    const classes = html.match(/class="([^"]*)"/)?.[1] ?? '';
    expect(classes).toContain('hover:');
  });

  it('keeps native disabled and disabled: variants on a disabled button', async () => {
    const html = await render({ disabled: true });
    expect(html).toMatch(/<button\b[^>]*\bdisabled(?:\s|>|=)/);
    const classes = html.match(/class="([^"]*)"/)?.[1] ?? '';
    expect(classes).toContain('disabled:');
  });
});

describe('Button hover fill', () => {
  // The dot field behind the page shows through a transparent control; a solid
  // fill on hover keeps the label readable over it.
  it.each(['secondary', 'ghost'] as const)('fills the %s variant on hover', async (variant) => {
    const html = await render({ href: '/x', variant });
    expect(html).toMatch(/\bhover:bg-surface-elevated\b/);
  });
});

describe('Outline links fill on hover', () => {
  it.each([
    'src/components/home/Hero.astro',
    'src/components/home/Contact.astro',
    'src/components/ai-view/AiBar.astro',
  ])('%s', async (file) => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(file, 'utf8');
    expect(source).toMatch(/\bhover:bg-surface-elevated\b/);
  });

  it('passes download through on a link, so a file is saved instead of opened', async () => {
    expect(await render({ href: '/cv.pdf', download: 'cv.pdf' })).toMatch(/<a[^>]*\bdownload="cv\.pdf"/);
    expect(await render({ href: '/cv.pdf' })).not.toContain('download');
    // A <button> has no download attribute.
    expect(await render({ download: 'cv.pdf' })).not.toContain('download');
  });
});
