import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Prose from '../../src/components/ui/Prose.astro';

describe('Prose', () => {
  it('caps the measure so long-form case text stays readable', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(Prose, {
      slots: { default: '<p>texto</p>' },
    });

    expect(html).toContain('max-w-[68ch]');
  });
});
