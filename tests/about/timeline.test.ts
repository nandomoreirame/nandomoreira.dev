import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Experience from '../../src/components/about/Experience.astro';
import Sobre from '../../src/pages/sobre.astro';

const work = [
  { name: 'Atual', position: 'AI Engineer', startDate: '2025-11', summary: 's' },
  { name: 'Antiga', position: 'Dev', startDate: '2020-01', endDate: '2024-06' },
];

describe('/sobre', () => {
  it('sets the h1 in the editorial serif at its regular weight', async () => {
    const container = await AstroContainer.create();
    const h1 = (await container.renderToString(Sobre)).match(/<h1[^>]*>/)?.[0] ?? '';
    expect(h1).toContain('font-serif');
    expect(h1).toContain('font-normal');
    expect(h1).not.toContain('font-semibold');
  });

  it('lays the results out in Cards', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Sobre);
    const results = html.slice(html.indexOf('id="resultados"'), html.indexOf('id="frentes"'));
    expect(results.match(/<li class="rounded-md border border-border bg-surface p-lg/g)?.length).toBeGreaterThan(0);
  });
});

describe('Experience timeline', () => {
  const render = async () => {
    const container = await AstroContainer.create();
    return container.renderToString(Experience, { props: { work } });
  };

  it('draws a vertical rule with one marker per role', async () => {
    const html = await render();
    expect(html).toMatch(/<ol[^>]*class="[^"]*\bborder-l\b[^"]*\bborder-border\b/);
    expect(html.match(/data-timeline-marker/g)).toHaveLength(2);
  });

  it('marks the current role in the accent, the past ones muted', async () => {
    const markers = (await render()).match(/<span[^>]*data-timeline-marker[^>]*>/g) ?? [];
    expect(markers[0]).toContain('bg-primary');
    expect(markers[1]).toContain('bg-border-strong');
  });

  it('shows the period in a mono chip', async () => {
    expect(await render()).toMatch(/<span[^>]*data-period[^>]*class="[^"]*\bfont-mono\b[^"]*\brounded-sm\b/);
  });
});
