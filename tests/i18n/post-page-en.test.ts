import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import PostPage from '../../src/components/pages/PostPage.astro';
import { getPostEntry } from '../../src/lib/content';
import { ptLeftovers } from '../helpers/pt-leftovers';

const EN_SLUG = 'the-false-green';

describe('English post page', () => {
  it('renders the English body with English chrome and a reciprocal pair', async () => {
    const entry = await getPostEntry(EN_SLUG, 'en');
    expect(entry).toBeDefined();
    const html = await (
      await AstroContainer.create()
    ).renderToString(PostPage, {
      props: { entry, locale: 'en' },
      request: new Request(`https://nandomoreira.dev/en/${EN_SLUG}`),
    });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    expect(html).toContain(`https://nandomoreira.dev/en/${EN_SLUG}`);
    expect(ptLeftovers(html).length).toBeLessThanOrEqual(3);
  });
});
