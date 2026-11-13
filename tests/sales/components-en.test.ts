import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import AboutCard from '../../src/components/sales/AboutCard.astro';
import AboutProfile from '../../src/components/sales/AboutProfile.astro';
import FaqList from '../../src/components/sales/FaqList.astro';
import FloatingActions from '../../src/components/sales/FloatingActions.astro';
import HeroArt from '../../src/components/sales/HeroArt.astro';
import HeroScenery from '../../src/components/sales/HeroScenery.astro';
import MoreWork from '../../src/components/sales/MoreWork.astro';
import ProjectShowcase from '../../src/components/sales/ProjectShowcase.astro';
import SalesContact from '../../src/components/sales/SalesContact.astro';
import SalesCta from '../../src/components/sales/SalesCta.astro';
import SalesHero from '../../src/components/sales/SalesHero.astro';
import SectionIntro from '../../src/components/sales/SectionIntro.astro';
import ServiceBlocks from '../../src/components/sales/ServiceBlocks.astro';
import ServiceComparison from '../../src/components/sales/ServiceComparison.astro';
import ServiceDetail from '../../src/components/sales/ServiceDetail.astro';
import SituationGrid from '../../src/components/sales/SituationGrid.astro';
import StepsTimeline from '../../src/components/sales/StepsTimeline.astro';
import Testimonials from '../../src/components/sales/Testimonials.astro';
import ToolsGrid from '../../src/components/sales/ToolsGrid.astro';
import { detailFor } from '../../src/lib/sales/catalog';
import { salesCopy } from '../../src/lib/sales/copy';
import type { Locale } from '../../src/lib/i18n/locale';
import { ptLeftovers } from '../helpers/pt-leftovers';

const components = {
  AboutCard,
  AboutProfile,
  FaqList,
  FloatingActions,
  HeroArt,
  HeroScenery,
  MoreWork,
  ProjectShowcase,
  SalesContact,
  SalesCta,
  SalesHero,
  SectionIntro,
  ServiceBlocks,
  ServiceComparison,
  ServiceDetail,
  SituationGrid,
  StepsTimeline,
  Testimonials,
  ToolsGrid,
};
const render = async (name: keyof typeof components, locale: Locale) => {
  const service = detailFor(locale === 'en' ? 'website' : 'site-institucional', locale)!;
  const props: Record<string, unknown> = { locale };
  if (name === 'AboutProfile') Object.assign(props, { eyebrow: 'Profile', headingId: 'about', aboutHref: '/about' });
  if (name === 'FaqList') Object.assign(props, { id: 'faq', items: salesCopy(locale).faq });
  if (name === 'SalesContact')
    Object.assign(props, { origin: locale === 'en' ? 'landing-en' : 'landing', outcome: null });
  if (name === 'SalesCta') props.index = 0;
  if (name === 'SectionIntro') Object.assign(props, { id: 'intro', eyebrow: 'E', title: 'T', lead: 'L' });
  if (name === 'ServiceComparison') props.comparison = service.detail.comparison;
  if (name === 'ServiceDetail') props.service = service;
  return (await AstroContainer.create()).renderToString(components[name] as never, { props });
};

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-13T12:00:00Z'));
});
afterAll(() => vi.useRealTimers());
describe.each(Object.keys(components) as Array<keyof typeof components>)('%s language', name => {
  it('retains Portuguese markup', async () => {
    await expect(await render(name, 'pt-BR')).toMatchFileSnapshot(`../__snapshots__/sales-${name}.pt.html`);
  });
  it('renders English copy and accessible labels', async () => {
    const html = await render(name, 'en');
    expect(ptLeftovers(html)).toEqual([]);
    const attributes = [...html.matchAll(/(?:aria-label|placeholder|alt)="([^"]*)"/g)].map(match => match[1]);
    expect(ptLeftovers(`<p>${attributes.join(' ')}</p>`)).toEqual([]);
  });
});
