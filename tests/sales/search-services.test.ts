import { describe, expect, it } from 'vitest';
import { detailSlugs } from '../../src/lib/sales/catalog';
import { englishSearchResponse } from '../../src/pages/en/search.json';
import { GET } from '../../src/pages/search.json';

type Item = { kind: string; path: string; url?: string };
const serviceUrls = async (response: Response) =>
  ((await response.json()) as Item[]).filter(item => item.kind === 'service').map(item => item.path ?? item.url);

describe('search index services', () => {
  it('lists the landing plus only services that have a detail page, in both languages', async () => {
    const en = await serviceUrls(await englishSearchResponse(true));
    expect(en).toHaveLength(detailSlugs('en').length + 1);
    const pt = await serviceUrls(await GET({} as never));
    expect(pt).toHaveLength(detailSlugs('pt-BR').length + 1);
  });
});
