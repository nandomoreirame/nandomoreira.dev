import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../../src/components/layout/SiteHeader.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteHeader, {
    props: { name: 'Fernando Moreira Costa', ...props },
  });
};

describe('SiteHeader', () => {
  it('is a banner landmark wrapping the navigation', async () => {
    const html = await render();

    expect(html).toContain('<header');
    expect(html).toContain('<nav');
  });

  it('shows the profile name as the wordmark, linked to the home page', async () => {
    const html = await render();

    expect(html).toContain('Fernando Moreira Costa');
    expect(html).toMatch(/<a[^>]*href="\/"[^>]*>[\s\S]*?Fernando Moreira Costa[\s\S]*?<\/a>/);
  });

  it('paints the accent of the brand in the primary colour, keeping the text whole', async () => {
    const html = await render({ name: 'nandomoreira.dev', accent: 'moreira' });
    const link = html.match(/<a[^>]*href="\/"[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(link).toMatch(/<span class="text-primary">moreira<\/span>/);
    expect(link.replace(/<[^>]+>/g, '').replace(/\s+/g, '')).toBe('nandomoreira.dev');
  });

  it('opens the wordmark with the availability dot, hidden from screen readers', async () => {
    const html = await render({ name: 'nandomoreira.dev', accent: 'moreira', availability: { status: 'open' } });
    const links = html.match(/<a[^>]*href="\/"[^>]*>[\s\S]*?<\/a>/g) ?? [];

    // Desktop wordmark and the copy inside the mobile menu.
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link).toMatch(/<span[^>]*aria-hidden="true"[^>]*data-status-dot/);
      expect(link).toContain('text-success');
      expect(link).toContain('data-pulse');
      expect(link.indexOf('data-status-dot')).toBeLessThan(link.indexOf('nando'));
    }
  });

  it('sets the wordmark in the mono face, like a prompt', async () => {
    const html = await render({ name: 'nandomoreira.dev' });
    const link = html.match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';

    expect(link).toContain('font-mono');
    expect(link).not.toContain('font-serif');
  });

  it('shows the availability pill, linked to /servicos, on the right at every width', async () => {
    const html = await render({ availability: { status: 'open' } });
    const pill = html.match(/<a[^>]*href="\/servicos"[^>]*data-header-availability[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    const tag = pill.match(/<a[^>]*>/)?.[0] ?? '';

    expect(pill).toContain('data-status-dot');
    expect(pill).toContain('text-success');
    expect(tag).toMatch(/class="[^"]*\binline-flex\b/);
    expect(tag).not.toMatch(/\bhidden\b/);
    expect(tag).toContain('max-md:ml-auto');
  });

  it('says only "Disponível" below lg and the full label from lg, which is also its accessible name', async () => {
    const html = await render({ availability: { status: 'open' } });
    const pill = html.match(/<a[^>]*data-header-availability[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(pill).toMatch(/<span class="lg:hidden">Disponível<\/span>/);
    expect(pill).toMatch(/<span class="hidden lg:inline">Disponível para novos projetos<\/span>/);
    expect(pill).toContain('aria-label="Disponível para novos projetos"');
  });

  it('keeps the menu toggle after the pill on phones', async () => {
    const html = await render({ availability: { status: 'open' } });
    expect(html).toMatch(
      /<div[^>]*class="[^"]*\bmax-md:order-last\b[^"]*"[^>]*>\s*<button[^>]*popovertarget="site-menu"/,
    );
  });

  it('leaves the pill out when no availability is given', async () => {
    expect(await render()).not.toContain('data-header-availability');
  });

  it('places the wordmark before the navigation, so it reads on the left', async () => {
    const html = await render();

    expect(html.indexOf('Fernando Moreira Costa')).toBeLessThan(html.indexOf('<nav'));
  });

  it('pushes the navigation to the opposite edge of the wordmark', async () => {
    expect(await render()).toContain('justify-between');
  });

  it('keeps wordmark and hamburger on one row on mobile, left and right', async () => {
    const html = await render();
    const row = html.match(/<header[\s\S]*?<div([^>]*)>[\s\S]*?href="\/"/)?.[1] ?? '';

    expect(row).toMatch(/\bflex\b/);
    expect(row).toMatch(/\bitems-center\b/);
    expect(row).toMatch(/\bjustify-between\b/);
    expect(row).not.toMatch(/\bflex-col\b/);
    expect(html).toMatch(/aria-label="Abrir menu"/);
  });

  it('caps its inner row at the frame token, keeping the hairline full-bleed and always on', async () => {
    const html = await render();

    // The border sits on <header>; the container lives on the row inside it, so
    // the rule spans the viewport while the content stays on the frame.
    expect(html).toMatch(/<header[^>]*\bborder-b\b[^>]*\bborder-border\b/);
    expect(html).not.toMatch(/<header[^>]*\bborder-transparent\b/);
    expect(html).toContain('max-w-frame');
  });

  it('ships no theme toggle, per the dark-only decision', async () => {
    const html = await render();

    expect(html).not.toContain('<script');
    expect(html).not.toContain('theme-toggle');
    expect(html).not.toContain('client:');
  });

  it('forwards the posts flag and the current route to the navigation', async () => {
    const html = await render({ hasPosts: true, current: '/portfolio' });

    expect(html).toContain('href="/posts"');
    expect(html).toContain('aria-current="page"');
  });
});

describe('AVAILABILITY_SHORT', () => {
  it('gives the header a one-word status per state', async () => {
    const { AVAILABILITY_SHORT } = await import('../../src/lib/layout/availability');
    expect(AVAILABILITY_SHORT).toEqual({ open: 'Disponível', limited: 'Limitado', closed: 'Indisponível' });
  });
});

describe('SiteHeader mobile menu', () => {
  it('keeps the availability pill in the open menu, between the wordmark and the close button', async () => {
    const html = await render({ availability: { status: 'open' } });
    const menu = html.slice(html.indexOf('id="site-menu"'));
    const row = menu.slice(0, menu.indexOf('aria-label="Fechar menu"'));
    const pill = row.match(/<a[^>]*data-menu-availability[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';

    expect(row.indexOf('href="/"')).toBeLessThan(row.indexOf('data-menu-availability'));
    expect(pill).toMatch(/href="\/servicos"/);
    // An internal page: the arrow points ahead, not out.
    expect(pill).toContain('→');
    expect(pill).not.toContain('↗');
    expect(pill).toContain('aria-label="Disponível para novos projetos"');
    expect(pill).toMatch(/<span class="lg:hidden">Disponível<\/span>/);
    expect(pill.match(/<a[^>]*>/)?.[0]).toContain('ml-auto');
    expect(pill).not.toContain('slot=');
  });

  it('leaves the menu without a pill when no availability is given', async () => {
    expect(await render()).not.toContain('data-menu-availability');
  });
});
