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
    // The full brand (from md up) stays one unbroken text; ndm.dev is the narrow-screen copy.
    const full = link.match(/<span class="max-md:hidden">[\s\S]*?\.dev<\/span>/)?.[0] ?? '';
    expect(full.replace(/<[^>]+>/g, '').replace(/\s+/g, '')).toBe('nandomoreira.dev');
  });

  it('opens the wordmark with the brand mark, hidden from screen readers and without the availability dot', async () => {
    const html = await render({ name: 'nandomoreira.dev', accent: 'moreira', availability: { status: 'open' } });
    const links = html.match(/<a[^>]*href="\/"[^>]*>[\s\S]*?<\/a>/g) ?? [];

    // Desktop wordmark and the copy inside the mobile menu.
    expect(links.length).toBe(2);
    for (const link of links) {
      expect(link).toMatch(/<img[^>]*src="\/brand-mark\.png"[^>]*alt=""/);
      expect(link).not.toContain('data-status-dot');
      expect(link.indexOf('brand-mark')).toBeLessThan(link.indexOf('nando'));
    }
  });

  it('sets the wordmark in the mono face, like a prompt', async () => {
    const html = await render({ name: 'nandomoreira.dev' });
    const link = html.match(/<a[^>]*href="\/"[^>]*>/)?.[0] ?? '';

    expect(link).toContain('font-mono');
    expect(link).not.toContain('font-serif');
  });

  it('shows the availability pill, linked to /contato, on the right at every width', async () => {
    const html = await render({ availability: { status: 'open' } });
    const pill = html.match(/<a[^>]*href="\/contato"[^>]*data-header-availability[^>]*>[\s\S]*?<\/a>/)?.[0] ?? '';
    const tag = pill.match(/<a[^>]*>/)?.[0] ?? '';

    expect(pill).toContain('data-status-dot');
    expect(pill).toContain('text-success');
    expect(tag).toMatch(/class="[^"]*\binline-flex\b/);
    expect(tag).not.toMatch(/\bhidden\b/);
    // No auto margin: below md the row's justify-between spreads logo, pill, EN and menu evenly.
    expect(tag).not.toContain('ml-auto');
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

  // Since 2026-11-08 the switch is in the bar, right of the availability pill.
  // The bar's toggle lives outside the menu; below md it hides and the menu's copy takes over.
  const barOf = (html: string) => html.slice(html.indexOf('</nav></div></div>'));

  it('carries the bar theme switch right of the availability pill (theme-modes, REQ-004)', async () => {
    const html = await render({ availability: { status: 'open' } });
    const bar = barOf(html);
    expect(bar.match(/<button[^>]*data-theme-toggle[^>]*>/g) ?? []).toHaveLength(1);
    const pill = bar.indexOf('data-header-availability');
    const toggle = bar.search(/<button[^>]*data-theme-toggle/);
    expect(pill).toBeGreaterThan(-1);
    expect(toggle).toBeGreaterThan(pill);
  });

  it('keeps the theme switch in the bar when there is no availability pill', async () => {
    const html = await render();
    expect(barOf(html).match(/<button[^>]*data-theme-toggle[^>]*>/g) ?? []).toHaveLength(1);
  });

  it('keeps the language switch in the bar on every width and hides only the theme switch below md', async () => {
    const bar = barOf(await render({ availability: { status: 'open' } }));
    expect(bar.match(/<button[^>]*data-theme-toggle[^>]*>/)?.[0]).toContain('max-md:hidden');
    expect(bar.match(/<a[^>]*data-language-switch[^>]*>/)?.[0]).not.toContain('max-md:hidden');
  });

  it('tightens and wraps the row below md instead of pushing anything off screen', async () => {
    const row = (await render()).match(/<header[^>]*>\s*<div class="([^"]*)"/)?.[1] ?? '';
    expect(row).toContain('max-md:flex-wrap');
    expect(row).toContain('gap-xs');
    expect(row).toContain('md:gap-md');
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
    expect(pill).toMatch(/href="\/contato"/);
    // An internal page: the arrow points ahead, not out.
    expect(pill).toContain('→');
    expect(pill).not.toContain('↗');
    expect(pill).toContain('aria-label="Disponível para novos projetos"');
    expect(pill).toMatch(/<span class="lg:hidden">Disponível<\/span>/);
    // Spread evenly by the row's justify-between, like the closed bar.
    expect(pill.match(/<a[^>]*>/)?.[0]).not.toContain('ml-auto');
    expect(pill).not.toContain('slot=');
  });

  it('leaves the menu without a pill when no availability is given', async () => {
    expect(await render()).not.toContain('data-menu-availability');
  });
});

describe('SiteHeader mobile menu switches', () => {
  it('puts the theme switch after the pill and leaves the language switch in the bar', async () => {
    const html = await render({ availability: { status: 'open' } });
    const menu = html.slice(html.indexOf('id="site-menu"'));
    const row = menu.slice(0, menu.indexOf('aria-label="Fechar menu"'));
    expect(row).not.toContain('data-language-switch');
    expect(row.search(/<button[^>]*data-theme-toggle/)).toBeGreaterThan(row.indexOf('data-menu-availability'));
  });

  it('never squeezes the close button and wraps the menu row instead of overflowing', async () => {
    const html = await render({ availability: { status: 'open' } });
    expect(html.match(/<button[^>]*aria-label="Fechar menu"[^>]*>/)?.[0]).toContain('shrink-0');
    const menuRow = html.match(/id="site-menu"[^>]*>\s*<div class="([^"]*)"/)?.[1] ?? '';
    expect(menuRow).toContain('flex-wrap');
    expect(menuRow).toContain('gap-xs');
  });
});

describe('SiteHeader compact mobile controls', () => {
  it('narrows the icon buttons that only exist below md to 32px, keeping the 44px height', async () => {
    const html = await render({ availability: { status: 'open' } });
    for (const label of ['Abrir menu', 'Fechar menu']) {
      const button = html.match(new RegExp(`<button[^>]*aria-label="${label}"[^>]*>`))?.[0] ?? '';
      expect(button).toContain('h-11');
      expect(button).toContain('w-8');
      expect(button).not.toContain('size-11');
    }
    const menu = html.slice(html.indexOf('id="site-menu"'));
    const toggle = menu.match(/<button[^>]*data-theme-toggle[^>]*>/)?.[0] ?? '';
    expect(toggle).toContain('h-11 w-8');
    expect(toggle).not.toContain('size-11');
  });

  it('pads the bar language switch on its left below md, matching the gap to the menu icon', async () => {
    const bar = (await render({ availability: { status: 'open' } })).slice(
      (await render({ availability: { status: 'open' } })).indexOf('</nav></div></div>'),
    );
    expect(bar.match(/<a[^>]*data-language-switch[^>]*>/)?.[0]).toContain('max-md:pl-sm');
  });
});

describe('AvailabilityPill padding', () => {
  it('keeps 12px of side padding on narrow screens and 16px from sm', async () => {
    const tag =
      (await render({ availability: { status: 'open' } })).match(/<a[^>]*data-header-availability[^>]*>/)?.[0] ?? '';
    expect(tag).toMatch(/\bpx-3\b/);
    expect(tag).toMatch(/\bsm:px-md\b/);
  });
});
