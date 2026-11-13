import { describe, expect, it } from 'vitest';
import { englishOgPages } from '../../src/lib/og/pages';
import { detailSlugs, detailFor } from '../../src/lib/sales/catalog';

describe('English sales share cards', () => {
  it('includes the landing and each published detail with translated titles', async () => {
    const pages = await englishOgPages(true);
    expect(pages.find(page => page.key === 'en/services')).toMatchObject({
      eyebrow: 'Services',
      title: expect.stringContaining('5 to 30 business days'),
    });
    for (const slug of detailSlugs('en')) {
      expect(pages.find(page => page.key === `en/services/${slug}`)).toMatchObject({
        title: detailFor(slug, 'en')!.detail.hero.title,
        eyebrow: 'Services',
      });
    }
    expect(await englishOgPages(false)).toEqual([]);
  });
});
