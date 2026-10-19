import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ListRow from '../../src/components/ui/ListRow.astro';

const base = {
  href: '/portfolio/forja',
  title: 'Forja',
  summary: 'Cliente GUI multi-CLI para agentes de código',
  markers: ['Rust', 'Tauri'],
  stamp: '01/2026',
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ListRow, { props: { ...base, ...props } });
};

describe('ListRow', () => {
  it('links the whole row to its destination', async () => {
    expect(await render()).toContain('href="/portfolio/forja"');
  });

  it('shows the stamp when the item has one', async () => {
    expect(await render()).toContain('01/2026');
  });

  it('stacks the stamp above the title below sm, so the title gets the full width on a phone', async () => {
    const html = await render();
    const row = html.match(/<a[^>]*>/)?.[0] ?? '';
    const stamp = html.match(/<span[^>]*data-stamp[^>]*>/)?.[0] ?? '';

    expect(row).toContain('grid-cols-[1fr_auto] sm:grid-cols-[4.5rem_1fr_auto]');
    expect(stamp).toContain('col-start-1 row-start-1');
    expect(html.indexOf('data-stamp')).toBeLessThan(html.indexOf('data-title'));
  });

  it('widens the leading column for a full date, so every post row aligns', async () => {
    const row = (await render({ stamp: '16 out. 2026' })).match(/<a[^>]*>/)?.[0] ?? '';
    expect(row).toContain('sm:grid-cols-[7rem_1fr_auto]');
  });

  it('keeps the stamp in its own leading column from sm', async () => {
    const html = await render();
    const content = html.match(/<span[^>]*data-content[^>]*>/)?.[0] ?? '';

    expect(content).toContain('row-start-2');
    expect(content).toContain('sm:col-start-2 sm:row-start-1');
  });

  it('collapses the leading column when there is no stamp', async () => {
    const html = await render({ stamp: undefined });

    expect(html).not.toContain('01/2026');
    expect(html).toContain('grid-cols-[1fr_auto]');
  });

  it('wraps a long title instead of cutting it, so it reads on a phone', async () => {
    const html = await render({ title: 'Um título longo o bastante para não caber numa linha só no celular' });
    const title = html.match(/<span[^>]*data-title[^>]*>/)?.[0] ?? '';

    expect(title).not.toBe('');
    expect(title).not.toContain('truncate');
    expect(title).not.toContain('line-clamp');
  });

  it('clamps the summary to two lines and hides it below sm', async () => {
    const summary = (await render()).match(/<span[^>]*data-summary[^>]*>/)?.[0] ?? '';

    // line-clamp sets its own display, so it is also what shows it from sm.
    expect(summary).toContain('hidden sm:line-clamp-2');
  });

  it('shows the markers at every width, under the title', async () => {
    const html = await render();
    const markers = html.match(/<span[^>]*data-markers[^>]*>/)?.[0] ?? '';

    expect(markers).not.toBe('');
    expect(markers).not.toContain('hidden');
    expect(html.indexOf('data-markers')).toBeGreaterThan(html.indexOf('data-title'));
  });

  it('renders each of the first three markers as its own chip', async () => {
    const html = await render({ markers: ['Rust', 'Tauri', 'Astro'] });
    // Boolean attr renders as `data-marker` (no =); avoid matching `data-markers`.
    const chips = [...html.matchAll(/<span data-marker\b[^>]*>/g)];

    expect(chips).toHaveLength(3);
    expect(html).toContain('>Rust<');
    expect(html).toContain('>Tauri<');
    expect(html).toContain('>Astro<');
    for (const [chip] of chips) {
      expect(chip).toContain('rounded-sm');
      expect(chip).toContain('border-border');
      expect(chip).toContain('bg-surface');
      expect(chip).toContain('font-mono');
      expect(chip).toContain('text-micro');
    }
  });

  it('caps marker chips at three when the item has more', async () => {
    const html = await render({ markers: ['a', 'b', 'c', 'd', 'e'] });
    expect([...html.matchAll(/<span data-marker\b/g)]).toHaveLength(3);
    expect(html).not.toContain('>d<');
    expect(html).not.toContain('>e<');
  });

  it('puts decorative separators between marker chips, never at the ends', async () => {
    const html = await render({ markers: ['Rust', 'Tauri', 'Astro'] });
    const markersBlock = html.match(/<span[^>]*data-markers[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    const separators = [...markersBlock.matchAll(/<span[^>]*aria-hidden="true"[^>]*>·<\/span>/g)];

    expect(separators).toHaveLength(2);
    expect(markersBlock).not.toMatch(/^[\s\S]*data-markers[^>]*>\s*<span[^>]*aria-hidden="true"[^>]*>·/);
  });

  it('keeps the draft badge before the marker chips', async () => {
    const html = await render({ badge: 'Rascunho', markers: ['Rust'] });
    const chip = html.indexOf('<span data-marker ');
    expect(chip).toBeGreaterThan(-1);
    expect(html.indexOf('Rascunho')).toBeLessThan(chip);
  });

  it('exposes a visible focus ring, since the row is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('marks the advance indicator as decorative and uses the Lucide arrow', async () => {
    const html = await render();

    expect(html).toContain('data-icon="lucide:arrow-right"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('→');
  });

  it('renders no marker column when the item has none', async () => {
    const html = await render({ markers: [] });
    expect(html).not.toContain('data-markers');
  });
});
