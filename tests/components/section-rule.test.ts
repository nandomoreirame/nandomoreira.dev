import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SectionRule from '../../src/components/ui/SectionRule.astro';

describe('SectionRule', () => {
  it('is a decorative full-bleed hairline', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(SectionRule);
    const classes = (html.match(/<hr[^>]*class="([^"]*)"/)?.[1] ?? '').split(/\s+/);

    expect(html).toMatch(/<hr[^>]*aria-hidden="true"/);
    expect(classes).toEqual(
      expect.arrayContaining(['relative', 'left-1/2', 'w-screen', '-translate-x-1/2', 'border-t', 'border-border']),
    );
  });
});
