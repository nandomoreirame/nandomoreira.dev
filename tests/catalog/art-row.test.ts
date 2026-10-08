import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ArtRow from '../../src/components/catalog/ArtRow.astro';
import { generateArt } from '../../src/lib/art';

const base = {
  href: '/portfolio/seu-atelie-aqui',
  title: 'Seu Ateliê Aqui',
  stamp: '11/2025',
  summary: 'Plataforma de anúncio de ateliês por proximidade geográfica',
  tags: ['TypeScript', 'React', 'Leaflet', 'Firebase', 'Vite'],
  status: [] as string[],
  art: generateArt({ slug: 'seu-atelie-aqui', block: 'professional', art: 'map', aspect: 'card' }),
};

const render = async (props: Partial<typeof base> = {}) => {
  const container = await AstroContainer.create();
  return container.renderToString(ArtRow, { props: { ...base, ...props } });
};

describe('ArtRow', () => {
  it('is a single link to the real case route', async () => {
    const html = await render();
    expect(html.match(/<a\b/g)).toHaveLength(1);
    expect(html).toContain('href="/portfolio/seu-atelie-aqui"');
  });

  it('puts the art first and the text after it, as the reading order', async () => {
    const html = await render();
    const art = html.indexOf('data-motif="map"');
    expect(art).toBeGreaterThan(-1);
    expect(art).toBeLessThan(html.indexOf('Seu Ateliê Aqui'));
  });

  it('shows the title, the date, the summary and up to four tags', async () => {
    const html = await render();
    expect(html).toContain('11/2025');
    expect(html).toContain('proximidade geográfica');
    expect(html).toContain('Firebase');
    expect(html).not.toContain('Vite');
  });

  it('shows the situation of the case when there is one', async () => {
    expect(await render({ status: ['Descontinuado'] })).toContain('Descontinuado');
    expect(await render()).not.toContain('Descontinuado');
  });

  it('stacks on narrow screens and splits art and text from sm up', async () => {
    const html = await render();
    expect(html).toMatch(/\bsm:grid-cols-5\b/);
    expect(html).toMatch(/\bsm:col-span-2\b/);
    expect(html).toMatch(/\bsm:col-span-3\b/);
  });

  it('marks itself as the parallax target and keeps the art decorative', async () => {
    const html = await render();
    expect(html).toContain('data-art');
    expect(html).toContain('aria-hidden="true"');
  });

  it('exposes a visible focus ring, since the row is a link', async () => {
    expect(await render()).toContain('focus-visible:outline-primary');
  });
});
