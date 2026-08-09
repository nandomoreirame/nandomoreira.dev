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

  it('truncates title and summary instead of widening the grid', async () => {
    const html = await render();
    expect((html.match(/truncate/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('hides the summary below sm and the markers below md', async () => {
    const html = await render();

    expect(html).toContain('hidden sm:block');
    expect(html).toContain('hidden md:block');
  });

  it('exposes a visible focus ring, since the row is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });

  it('marks the advance indicator as decorative', async () => {
    expect(await render()).toContain('aria-hidden="true"');
  });

  it('renders no marker column when the item has none', async () => {
    const html = await render({ markers: [] });
    expect(html).not.toContain('hidden md:block');
  });
});
