import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(SiteNav, { props });
};

describe('SiteNav', () => {
  it('carries the main sections that already exist as routes or anchors', async () => {
    const html = await render();

    for (const label of ['Portfólio', 'Lab', 'Sobre', 'Contato']) {
      expect(html).toContain(label);
    }

    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/lab"');
    expect(html).toContain('href="/sobre"');
    expect(html).toContain('href="/contato"');
  });

  it('shortens the lab label so five items fit the 768px measure', async () => {
    const html = await render();

    expect(html).not.toContain('Laboratório');
    // Uppercase is applied in CSS, so the accessible name stays "Lab" and does
    // not read as an acronym to a screen reader.
    expect(html).toContain('>Lab<');
  });

  it('shows Notas only when at least one note is published', async () => {
    const withNotes = await render({ hasNotes: true });
    expect(withNotes).toContain('Notas');
    expect(withNotes).toContain('href="/notas"');

    const without = await render({ hasNotes: false });
    expect(without).not.toContain('href="/notas"');
    expect(without).not.toContain('Notas');
  });

  it('marks the current page for assistive technology', async () => {
    expect(await render({ current: '/portfolio' })).toContain('aria-current="page"');
  });

  it('is a navigation landmark with an accessible name', async () => {
    const html = await render();

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label=');
  });

  it('works without JavaScript, so no island and no toggle state', async () => {
    expect(await render()).not.toContain('client:');
  });

  it('never points at a route that does not exist', async () => {
    const html = await render();

    expect(html).not.toContain('href="/projetos"');
    expect(html).not.toContain('href="/agents"');
    // `/contato` used to be listed here as a non-existent route. It is a real
    // page now, so the anchor it replaced is what must not come back.
    expect(html).not.toContain('href="/#contato"');
  });
});
