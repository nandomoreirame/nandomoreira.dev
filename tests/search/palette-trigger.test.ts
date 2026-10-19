import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteHeader from '../../src/components/layout/SiteHeader.astro';
import BaseLayout from '../../src/layouts/BaseLayout.astro';

const renderLayout = async (props: { noindex?: boolean } = {}) =>
  (await AstroContainer.create()).renderToString(BaseLayout, {
    props: { title: 'Título', description: 'Descrição', ...props },
    slots: { default: '<p>conteúdo</p>' },
  });

const corner = (html: string) => html.match(/<div[^>]*data-corner-actions[^>]*>[\s\S]*?<\/nav>\s*<\/div>/)?.[0] ?? '';

describe('palette trigger', () => {
  it('is hidden until the script shows it, with an accessible name', async () => {
    const html = await renderLayout();
    const button = html.match(/<button[^>]*data-palette-trigger[^>]*>/)?.[0] ?? '';
    expect(button).toContain('hidden');
    expect(button).toContain('type="button"');
    expect(button).toContain('aria-label="Abrir a busca"');
    expect(button).toContain('aria-haspopup="dialog"');
    expect(button).toMatch(/min-h-11/);
    expect(button).toContain('aria-keyshortcuts="Control+K Meta+K"');
  });

  it('matches the AI switcher box and opens a "+ K" label on hover or focus', async () => {
    const html = await renderLayout();
    const button = html.match(/<button[^>]*data-palette-trigger[^>]*>[\s\S]*?<\/button>/)?.[0] ?? '';
    // Same outer size as the switcher (its link plus the nav border): content box, px-md, 14 px icon.
    expect(button).toMatch(/\bbox-content\b/);
    expect(button).toMatch(/\bpx-md\b/);
    expect(button).not.toMatch(/\bmin-w-11\b/);
    expect(button).toMatch(/size-3\.5/);
    const label = button.match(/<span[^>]*>\s*\+ K\s*<\/span>/)?.[0] ?? '';
    expect(label).toMatch(/max-w-0/);
    expect(label).toMatch(/group-hover\/palette:max-w-20/);
    expect(label).toMatch(/group-focus-visible\/palette:max-w-20/);
  });

  it('left the header for the bottom-right corner', async () => {
    const header = await (
      await AstroContainer.create()
    ).renderToString(SiteHeader, { props: { availability: { status: 'open' } } });
    expect(header).not.toContain('data-palette-trigger');
  });

  it('sits above the AI switcher in one fixed corner stack', async () => {
    const group = corner(await renderLayout());
    expect(group).toMatch(/^<div[^>]*class="[^"]*\bfixed\b[^"]*\bright-lg\b[^"]*\bbottom-lg\b/);
    expect(group).toMatch(/flex-col/);
    expect(group).toContain('data-reader-hide');
    const trigger = group.indexOf('data-palette-trigger');
    const switcher = group.indexOf('aria-label="Visão da página"');
    expect(trigger).toBeGreaterThan(-1);
    expect(switcher).toBeGreaterThan(trigger);
  });

  it('keeps the trigger on a page without the switcher', async () => {
    const html = await renderLayout({ noindex: true });
    expect(html).not.toContain('aria-label="Visão da página"');
    expect(html).toContain('data-palette-trigger');
  });
});
