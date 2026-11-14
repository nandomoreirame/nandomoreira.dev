import { describe, expect, it } from 'vitest';
import { detailSlugs } from '../../src/lib/sales/catalog';
import { salesUrl } from '../../src/lib/sales/host';
import type { Locale } from '../../src/lib/i18n/locale';
import { englishSearchResponse } from '../../src/pages/en/search.json';
import { GET } from '../../src/pages/search.json';

type Item = { kind: string; path: string };
const servicePaths = async (response: Response) =>
  ((await response.json()) as Item[]).filter(item => item.kind === 'service').map(item => item.path);

const expectedPaths = (locale: Locale) => [
  salesUrl(undefined, undefined, locale),
  ...detailSlugs(locale).map(slug => salesUrl(slug, undefined, locale)),
];

describe('search index services', () => {
  it('lists the landing plus exactly the services that have a detail page, in both languages', async () => {
    expect(await servicePaths(await englishSearchResponse(true))).toEqual(expectedPaths('en'));
    expect(await servicePaths(await GET({} as never))).toEqual(expectedPaths('pt-BR'));
  });
});
