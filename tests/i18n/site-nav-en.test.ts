import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteNav from '../../src/components/layout/SiteNav.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('SiteNav in English', () => {
  it('links the English pages with English labels', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SiteNav, {
      props: { locale: 'en', hasPosts: true },
    });
    for (const href of [
      '/en/posts',
      '/en/portfolio',
      '/en/lab',
      '/en/setup',
      '/en/now',
      '/en/about',
      '/en/mcp',
      '/en/contact',
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('Now');
    expect(html).toContain('Open menu');
    expect(ptLeftovers(html)).toEqual([]);
  });
});
