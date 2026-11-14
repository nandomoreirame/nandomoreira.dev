import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, it, vi } from 'vitest';

vi.mock('../../src/lib/sales/catalog', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/lib/sales/catalog')>()),
  SHOW_DETAIL_LINKS: true,
}));

import ServiceBlocks from '../../src/components/sales/ServiceBlocks.astro';
import StepsTimeline from '../../src/components/sales/StepsTimeline.astro';
import { visibleText } from '../helpers/pt-leftovers';

it('localizes the compact process header used by English service details', async () => {
  const html = await (
    await AstroContainer.create()
  ).renderToString(StepsTimeline, {
    props: { locale: 'en', variant: 'compact' },
  });
  expect(html).toContain('Transparent process');
  expect(html).toContain('How we work, in 7 steps');
  expect(visibleText(html)).not.toMatch(/Metodologia|Como vamos fazer|etapas/);
});

it('localizes enabled service detail links without changing their destination', async () => {
  const html = await (
    await AstroContainer.create()
  ).renderToString(ServiceBlocks, {
    props: { locale: 'en' },
  });
  expect(html).toContain('href="/en/website"');
  expect(html).toContain('Explore the details');
  expect(html).not.toContain('Entender em detalhes');
});
