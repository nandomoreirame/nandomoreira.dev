import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SetupPage from '../../src/components/pages/SetupPage.astro';
import TocColumns from '../../src/components/ui/TocColumns.astro';

const items = [{ depth: 2 as const, slug: 'one', text: 'One' }];

describe('page index in English (REQ-003, REQ-008)', () => {
  it('TocColumns passes the locale down to the index', async () => {
    const container = await AstroContainer.create();
    const en = await container.renderToString(TocColumns, { props: { items, locale: 'en' } });
    expect(en).toContain('aria-label="Table of contents"');
    const pt = await container.renderToString(TocColumns, { props: { items } });
    expect(pt).toContain('aria-label="Índice"');
  });

  it('/en/setup names the index and its toggle in English, with no Portuguese accessible names', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SetupPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/setup'),
    });
    expect(html).toContain('aria-label="Table of contents"');
    expect(html).toContain('aria-label="Post table of contents"');
    expect(html).not.toMatch(/aria-label="Índice/);
  });
});
