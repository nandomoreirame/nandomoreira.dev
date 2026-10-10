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
    expect(html).toContain('Rust · Tauri');
  });

  it('exposes a visible focus ring, since the row is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('marks the advance indicator as decorative', async () => {
    expect(await render()).toContain('aria-hidden="true"');
  });

  it('renders no marker column when the item has none', async () => {
    const html = await render({ markers: [] });
    expect(html).not.toContain('data-markers');
  });
});
