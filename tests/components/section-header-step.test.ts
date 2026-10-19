import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionHeader from '../../src/components/ui/SectionHeader.astro';

const render = async (props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(SectionHeader, { props: { title: 'Desktop e sistema', ...props } });
};

describe('SectionHeader step', () => {
  it('prefixes the title with a two-digit step and //, hidden from screen readers', async () => {
    const html = await render({ step: 1 });
    const heading = html.match(/<h2[^>]*>[\s\S]*?<\/h2>/)?.[0] ?? '';

    expect(heading).toMatch(
      /<span aria-hidden="true" class="[^"]*\bfont-mono\b[^"]*\btext-primary\b[^"]*">01 \/\/<\/span>/,
    );
    expect(heading.indexOf('01 //')).toBeLessThan(heading.indexOf('Desktop e sistema'));
  });

  it('sets a numbered title in the sans at h3 size, not as an eyebrow', async () => {
    const heading = (await render({ step: 3 })).match(/<h2[^>]*>/)?.[0] ?? '';

    expect(heading).toContain('text-h3');
    expect(heading).toContain('font-medium');
    expect(heading).not.toContain('tracking-eyebrow');
  });

  it('keeps the eyebrow header when no step is given, even with an index', async () => {
    const html = await render({ index: 2 });

    expect(html).not.toContain('//');
    expect(html).toContain('tracking-eyebrow');
  });
});
