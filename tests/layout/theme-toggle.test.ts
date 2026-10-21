import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ThemeToggle from '../../src/components/layout/ThemeToggle.astro';
import { THEME_COPY } from '../../src/lib/theme/copy';

const render = async () => (await AstroContainer.create()).renderToString(ThemeToggle);
const css = readFileSync('src/styles/global.css', 'utf8');

describe('ThemeToggle (theme-modes, REQ-004)', () => {
  it('is a real button the boot script listens to', async () => {
    const html = await render();
    expect(html).toMatch(/<button[^>]*type="button"[^>]*data-theme-toggle/);
  });

  it('names the theme it switches to, one name per state', async () => {
    const html = await render();
    expect(THEME_COPY).toEqual({ toPaper: 'Usar tema claro', toNoir: 'Usar tema escuro' });
    expect(html).toMatch(/data-theme-when="noir"[\s\S]*Usar tema claro/);
    expect(html).toMatch(/data-theme-when="paper"[\s\S]*Usar tema escuro/);
  });

  it('keeps the icons out of the accessible name', async () => {
    const svgs = (await render()).match(/<svg[^>]*>/g) ?? [];
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) expect(svg).toContain('aria-hidden="true"');
  });

  it('is a 44px target with a visible focus ring', async () => {
    const button = (await render()).match(/<button[^>]*>/)?.[0] ?? '';
    expect(button).toContain('size-11');
    expect(button).toContain('focus-visible:outline-primary');
  });

  it('stays hidden until the boot ran, and shows only the current state', () => {
    const rule = css.match(/([^{}]*\[data-theme-toggle\][^{}]*)\{\s*display:\s*none;\s*\}/)?.[1] ?? '';
    expect(rule).toContain(':root:not([data-theme-boot]) [data-theme-toggle]');
    expect(rule).toContain(':root[data-theme="noir"] [data-theme-when="paper"]');
    expect(rule).toContain(':root[data-theme="paper"] [data-theme-when="noir"]');
  });
});
