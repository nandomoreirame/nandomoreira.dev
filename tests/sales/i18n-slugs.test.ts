import { describe, expect, it } from 'vitest';
import { SALES_SERVICES } from '../../src/lib/sales/catalog';
import { SALES_SLUGS_EN, salesSlugIn } from '../../src/lib/sales/i18n';

describe('English sales slugs', () => {
  it('maps the six services once in both directions', () => {
    expect(SALES_SLUGS_EN).toEqual({
      'site-institucional': 'website',
      'landing-page': 'landing-page',
      blog: 'blog',
      'loja-virtual': 'online-store',
      'produto-web': 'web-product',
      'automacao-ia': 'ai-automation',
    });
    expect(Object.keys(SALES_SLUGS_EN).sort()).toEqual(SALES_SERVICES.map(s => s.slug).sort());
    expect(new Set(Object.values(SALES_SLUGS_EN)).size).toBe(6);
    for (const [pt, en] of Object.entries(SALES_SLUGS_EN)) {
      expect(salesSlugIn(pt, 'en')).toBe(en);
      expect(salesSlugIn(en, 'pt-BR')).toBe(pt);
    }
  });

  it.each(['nope', '__proto__', 'constructor', 'toString', ''])('rejects unknown slug %s', slug => {
    expect(salesSlugIn(slug, 'en')).toBeUndefined();
    expect(salesSlugIn(slug, 'pt-BR')).toBeUndefined();
  });
});
