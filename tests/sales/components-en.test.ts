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
/** English strings each component must render; the artwork and SectionIntro carry no copy of their own. */
const EXPECTED: Record<keyof typeof components, string[]> = {
  AboutCard: ['Who will build it', 'Senior software developer in São Paulo'],
  AboutProfile: ['Senior software developer in São Paulo', 'Talk directly to the person building it'],
  FaqList: ['Frequently asked questions', 'How much does it cost?'],
  FloatingActions: ['Talk to me on WhatsApp', 'Use dark theme'],
  HeroArt: ['storefront'],
  HeroScenery: [],
  MoreWork: ['Other work', 'Online store'],
  ProjectShowcase: ['Real projects', 'Visit Encantos Brincantes'],
  SalesContact: ['What are you looking for?', 'I prefer to talk on WhatsApp'],
  SalesCta: ['Already know what you need?', 'Request a quote'],
  SalesHero: ['Websites, stores and systems for your business', 'I want a quote'],
  SectionIntro: [],
  ServiceBlocks: ['Choose by the problem you want to solve', 'What you receive'],
  ServiceComparison: ['Comparison: which one fits?', 'Number of pages'],
  ServiceDetail: ['Project anatomy', 'I want a website like this'],
  SituationGrid: ['Not sure where to start?', 'Choose the statement closest to where you are today.'],
  StepsTimeline: ['How I work', 'Interview'],
  Testimonials: ['What they say', 'translated from Portuguese'],
  ToolsGrid: ['What technology does for your business', 'Fast anywhere'],
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
    const text = html.replace(/<[^>]*>/g, ' ');
    for (const expected of EXPECTED[name]) expect(text).toContain(expected);
    const attributes = [...html.matchAll(/(?:aria-label|placeholder|alt)="([^"]*)"/g)].map(match => match[1]);
    expect(ptLeftovers(`<p>${attributes.join(' ')}</p>`)).toEqual([]);
  });
});

describe('SalesContact budget label', () => {
  const label = (html: string) => /<label for="vendas-orcamento"[^>]*>([^<]*)<\/label>/.exec(html)?.[1];
  it('names the field Budget in English and Orçamento in Portuguese', async () => {
    expect(label(await render('SalesContact', 'en'))).toBe('Budget');
    expect(label(await render('SalesContact', 'pt-BR'))).toBe('Orçamento');
  });
});
