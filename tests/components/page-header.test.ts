import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PageHeader from '../../src/components/ui/PageHeader.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(PageHeader, { props });
};

const base = {
  path: '/lab',
  title: 'Coçando as minhas próprias coceiras',
  description: 'Ferramental para agentes de IA e utilitários de terminal.',
};

describe('PageHeader', () => {
  it('names the page as a terminal path before the only h1, muted and lower case', async () => {
    const html = await render(base);
    const eyebrow = html.match(/<p[^>]*data-page-path[^>]*>([^<]*)<\/p>/);

    expect(eyebrow?.[1]).toBe('~/lab');
    expect(eyebrow?.[0]).toContain('text-muted-foreground');
    expect(eyebrow?.[0]).not.toContain('uppercase');
    expect(html.indexOf('data-page-path')).toBeLessThan(html.indexOf('<h1'));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain('text-display');
  });

  it('sets the title in the editorial serif at its regular weight (Terminal Noir)', async () => {
    const h1 = (await render(base)).match(/<h1[^>]*>/)?.[0] ?? '';

    expect(h1).toContain('font-serif');
    expect(h1).toContain('font-normal');
    expect(h1).not.toContain('font-semibold');
  });

  it('follows the title with a large lead description', async () => {
    const html = await render(base);
    expect(html.indexOf('Ferramental para agentes')).toBeGreaterThan(html.indexOf('</h1>'));
    expect(html).toContain('data-page-lead');
  });

  it('lets the lead run the container width, no 68ch measure leaving a gap on the right', async () => {
    const lead = (await render(base)).match(/<p[^>]*data-page-lead[^>]*>/)?.[0] ?? '';
    expect(lead).not.toContain('max-w-');
  });

  it('shows only the page name in the eyebrow, never a count', async () => {
    expect(await render(base)).not.toMatch(/\(\d+\)/);
  });

  it('draws no rule under the eyebrow, since two close lines read as a box', async () => {
    expect(await render(base)).not.toMatch(/border-b/);
  });

  it('puts the update date between the title and the lead, as in the Stitch /now', async () => {
    const html = await render({ ...base, updatedAt: '2026-10-16' });
    const date = html.indexOf('<time datetime="2026-10-16"');
    expect(date).toBeGreaterThan(html.indexOf('</h1>'));
    expect(date).toBeLessThan(html.indexOf('data-page-lead'));
    expect(html).toContain('Atualizada em');
    expect(html).toMatch(/<div[^>]*data-page-updated[^>]*class="[^"]*\bmt-lg\b/);
    expect(html).toMatch(/<p[^>]*data-page-lead[^>]*class="[^"]*\bmt-lg\b/);
  });

  it('shows no date without updatedAt', async () => {
    const html = await render(base);
    expect(html).not.toContain('data-page-updated');
    expect(html).not.toContain('Atualizada em');
  });
});

describe('pages with an update date', () => {
  it.each(['src/pages/now.astro', 'src/pages/setup.astro', 'src/pages/privacidade.astro'])(
    '%s hands the date to PageHeader instead of a loose UpdatedAt',
    async file => {
      const source = (await import('node:fs')).readFileSync(file, 'utf8');
      expect(source).toMatch(/<PageHeader[^>]*updatedAt=\{/);
      expect(source).not.toContain('<UpdatedAt');
    },
  );
});
