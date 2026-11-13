import { describe, expect, it } from 'vitest';
import { SALES_SERVICES, detailFor, detailSlugs, serviceSchema } from '../../src/lib/sales/catalog';
import { SALES_SERVICES_EN } from '../../src/lib/sales/catalog-en';
import { SALES_SLUGS_EN } from '../../src/lib/sales/i18n';
import { englishSearchResponse } from '../../src/pages/en/search.json';
import { ptLeftovers } from '../helpers/pt-leftovers';

describe('English sales catalog', () => {
  it('preserves identifiers, icons, order and every existing detail', () => {
    expect(SALES_SERVICES_EN.map(s => [s.service, s.icon])).toEqual(SALES_SERVICES.map(s => [s.service, s.icon]));
    expect(SALES_SERVICES_EN.map(s => s.slug)).toEqual(SALES_SERVICES.map(s => SALES_SLUGS_EN[s.slug]));
    SALES_SERVICES.forEach((pt, index) => {
      const en = SALES_SERVICES_EN[index]!;
      expect(serviceSchema.safeParse(en).success).toBe(true);
      expect(Boolean(en.detail)).toBe(Boolean(pt.detail));
      if (pt.detail && en.detail) {
        for (const key of ['anatomy', 'fit', 'included', 'addons', 'underTheHood', 'faq'] as const) {
          expect(en.detail[key]).toHaveLength(pt.detail[key].length);
        }
        expect(en.detail.comparison.rows).toHaveLength(pt.detail.comparison.rows.length);
      }
    });
    expect(ptLeftovers(`<p>${JSON.stringify(SALES_SERVICES_EN)}</p>`)).toEqual([]);
  });

  it('keeps the Portuguese default and resolves English details', () => {
    expect(detailSlugs()).toEqual(['site-institucional']);
    expect(detailSlugs('en')).toEqual(['website']);
    expect(detailFor('website', 'en')?.service).toBe('website');
    expect(detailFor('website')).toBeUndefined();
  });

  it('serves English service titles and links from the English search index', async () => {
    const response = await englishSearchResponse(true);
    const items = await response.json();
    expect(items).toContainEqual(
      expect.objectContaining({ title: 'Website', path: 'https://contrate.nandomoreira.dev/en/website' }),
    );
    expect(items).toContainEqual(
      expect.objectContaining({ title: 'Services', path: 'https://contrate.nandomoreira.dev/en' }),
    );
  });
});
