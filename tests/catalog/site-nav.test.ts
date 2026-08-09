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

    // Agents (F9) returns when that page ships; until then the nav must not 404.
    for (const label of ['Projetos', 'Sobre', 'Contato']) {
      expect(html).toContain(label);
    }
  });

  it('marks the current page for assistive technology', async () => {
    expect(await render({ current: '/projetos' })).toContain('aria-current="page"');
  });

  it('is a navigation landmark with an accessible name', async () => {
    const html = await render();

    expect(html).toContain('<nav');
    expect(html).toContain('aria-label=');
  });

  it('works without JavaScript, so no island and no toggle state', async () => {
    expect(await render()).not.toContain('client:');
  });
});
