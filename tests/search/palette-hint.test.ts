import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '../../src/components/home/Hero.astro';

describe('home palette hint', () => {
  it('ships hidden, opens the palette, shows the keys as kbd and never competes with the primary call', async () => {
    const html = await (await AstroContainer.create()).renderToString(Hero, { props: { name: 'F', headline: 'H', positioning: 'P' } });
    const hint = html.match(/<button[^>]*data-palette-hint[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
    expect(hint).toMatch(/\bhidden\b/);
    expect(hint).toContain('data-palette-trigger');
    expect(hint).toMatch(/<kbd[^>]*data-palette-mod[^>]*>Ctrl<\/kbd>/);
    expect(hint).toMatch(/<kbd[^>]*>K<\/kbd>/);
    expect(hint).not.toMatch(/(?<=["\s])bg-primary\b/);
    expect(hint).toMatch(/<\/kbd>\s*para navegar\s*<span aria-hidden="true">→<\/span>/);
  });

  it('has a 44 px target, an accessible name with its visible text and the shortcut', async () => {
    const html = await (await AstroContainer.create()).renderToString(Hero, { props: { name: 'F', headline: 'H', positioning: 'P' } });
    const hint = html.match(/<button[^>]*data-palette-hint[^>]*>/)?.[0] ?? '';
    expect(hint).toMatch(/min-h-11/);
    expect(hint).toContain('aria-keyshortcuts="Control+K Meta+K"');
    expect(hint).toContain('aria-label="Abrir a busca (Pressione Ctrl K para navegar)"');
  });
});

describe('home call on touch screens', () => {
  it('links to /sobre through the ghost Button, in place of the keyboard hint', async () => {
    const html = await (await AstroContainer.create()).renderToString(Hero, { props: { name: 'F', headline: 'H', positioning: 'P' } });
    const wrapper = html.match(/<div[^>]*data-hero-about[^>]*>[\s\S]*?<\/a>\s*<\/div>/)?.[0] ?? '';
    const link = wrapper.match(/<a\b[^>]*>/)?.[0] ?? '';
    expect(link).toContain('href="/sobre"');
    expect(link).toContain('group/button');
    expect(link).not.toMatch(/(?<=["\s])bg-primary\b/);
    expect(wrapper).toContain('Saiba mais sobre mim');
  });

  it('shows only where the hint hides: touch screens', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/styles/global.css', 'utf8');
    expect(css).toMatch(/\[data-hero-about\]\s*\{\s*display:\s*none;?\s*\}/);
    expect(css).toMatch(/@media \(hover: none\)\s*\{[^@]*\[data-hero-about\]\s*\{\s*display:\s*block/);
  });
});
