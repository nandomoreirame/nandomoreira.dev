import { describe, expect, it } from 'vitest';
import { SERVICES } from '../../src/lib/hire/schema';
import { SALES_SERVICES, detailFor, detailSlugs, serviceAnchor } from '../../src/lib/sales/catalog';

describe('sales catalog', () => {
  it('offers the six services in the landing order', () => {
    expect(SALES_SERVICES.map((service) => service.service)).toEqual(SERVICES.filter((value) => value !== 'undecided'));
  });

  it('gives every service 3 or 4 items of what the client receives', () => {
    for (const service of SALES_SERVICES) {
      expect(service.receives.length, service.slug).toBeGreaterThanOrEqual(3);
      expect(service.receives.length, service.slug).toBeLessThanOrEqual(4);
    }
  });

  it('publishes a detail page only for the institutional website', () => {
    expect(detailSlugs()).toEqual(['site-institucional']);
    expect(detailFor('loja-virtual')).toBeUndefined();
    expect(detailFor('constructor')).toBeUndefined();
  });

  it('lays out the detail page as the Stitch screen does', () => {
    const { detail } = detailFor('site-institucional')!;

    expect(detail.anatomy).toHaveLength(4);
    expect(detail.fit).toHaveLength(4);
    expect(detail.comparison.columns).toEqual(['Site institucional', 'Landing page', 'Loja virtual']);
    for (const row of detail.comparison.rows) expect(row.values).toHaveLength(3);
    expect(detail.faq.map((item) => item.question)).toHaveLength(4);
  });

  it('lists the editing panel as an optional add-on (REQ-020)', () => {
    expect(detailFor('site-institucional')!.detail.addons.map((addon) => addon.title)).toContain('Painel de edição');
  });

  it('explains Firebase Hosting by the shop-window analogy', () => {
    expect(detailFor('site-institucional')!.detail.underTheHood.join(' ')).toContain('Firebase Hosting');
  });

  it('derives the anchor from the slug', () => {
    expect(serviceAnchor('blog')).toBe('servico-blog');
  });
});
