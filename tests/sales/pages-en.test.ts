import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EnglishDetailRoute from '../../src/pages/en/services/[slug].astro';
import SalesLandingPage from '../../src/components/pages/SalesLandingPage.astro';
import SalesDetailPage from '../../src/components/pages/SalesDetailPage.astro';
import { detailSlugs } from '../../src/lib/sales/catalog';
import { ptLeftovers } from '../helpers/pt-leftovers';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());
it('retains the Portuguese landing', async () => {
  const html = await (
    await AstroContainer.create()
  ).renderToString(SalesLandingPage, { request: new Request('https://contrate.nandomoreira.dev/') });
  await expect(html.replaceAll(process.cwd(), '<root>')).toMatchFileSnapshot('../__snapshots__/sales-landing.pt.html');
});

describe('English sales pages', () => {
  it('renders the full English landing and localized service anchors', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SalesLandingPage, {
      props: { locale: 'en', live: true },
      request: new Request('https://contrate.nandomoreira.dev/en'),
    });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('action="/api/hire?origem=landing-en"');
    expect(html).toContain('href="#servico-online-store"');
    expect(html).toContain('id="servico-online-store"');
    expect(html).toContain('translated from Portuguese');
    expect(ptLeftovers(html)).toEqual([]);
  });
  it.each(detailSlugs('en'))('renders English detail %s and form results', async slug => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(SalesDetailPage, {
      props: { slug, locale: 'en', live: true },
      request: new Request(`https://contrate.nandomoreira.dev/en/${slug}?envio=invalido`),
    });
    expect(html).toContain(`action="/api/hire?origem=${slug}"`);
    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(ptLeftovers(html)).toEqual([]);
  });
  it('rejects an unknown detail', async () => {
    const response = await (
      await AstroContainer.create()
    ).renderToResponse(SalesDetailPage, {
      props: { slug: 'nope', locale: 'en' },
      request: new Request('https://contrate.nandomoreira.dev/en/nope'),
    });
    expect(response.status).toBe(404);
  });
});

it('the English route itself returns 404 for an unknown detail', async () => {
  const response = await (
    await AstroContainer.create()
  ).renderToResponse(EnglishDetailRoute, {
    params: { slug: 'nope' },
    request: new Request('https://contrate.nandomoreira.dev/en/nope'),
  });
  expect(response.status).toBe(404);
});
