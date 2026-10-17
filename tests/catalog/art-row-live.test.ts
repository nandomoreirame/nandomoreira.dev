import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArtRow from '../../src/components/catalog/ArtRow.astro';
import { generateArt } from '../../src/lib/art';

const base = {
  href: '/portfolio/bragstack',
  title: 'BragStack',
  stamp: '02/2026',
  summary: 's',
  art: generateArt({ slug: 'bragstack', block: 'professional', art: 'map', aspect: 'card' }),
};

const render = async (props: Record<string, unknown> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ArtRow, { props: { ...base, ...props } });
};

describe('ArtRow live status', () => {
  it('shows "No ar · host" with the open status dot as text, keeping one link', async () => {
    const html = await render({ live: 'bragstack.app' });
    const status = html.match(/<span[^>]*data-live[^>]*>[\s\S]*?<\/span>\s*<\/span>/)?.[0] ?? '';
    expect(status).toContain('data-status-dot');
    expect(status).toContain('text-success');
    expect(status).toContain('No ar · bragstack.app');
    expect(html.match(/<a\b/g)).toHaveLength(1);
  });

  it('shows nothing without a live host', async () => {
    expect(await render()).not.toContain('data-live');
  });
});
