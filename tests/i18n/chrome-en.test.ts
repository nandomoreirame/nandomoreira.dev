import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SiteFooter from '../../src/components/layout/SiteFooter.astro';
import AiSwitcher from '../../src/components/ai-view/AiSwitcher.astro';
import NotFoundPage from '../../src/components/pages/NotFoundPage.astro';
import { aiViewLabels } from '../../src/lib/ai-view/labels';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (component: unknown, props: Record<string, unknown>) =>
  (await AstroContainer.create()).renderToString(component as never, { props });

describe('English chrome', () => {
  it('footer', async () => {
    // version is required since the releases tag landed; the plan predated it.
    const html = await render(SiteFooter, {
      locale: 'en',
      name: 'Fernando Moreira',
      year: 2026,
      contacts: [],
      version: 'v17.1',
    });
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('AI switcher', async () => {
    const html = await render(AiSwitcher, { locale: 'en', humanPath: '/en/about', view: 'human' });
    // On a human page the control names the AI view (plan said "Human"; that was the other side).
    expect(html).toContain('AI');
    expect(ptLeftovers(html)).toEqual([]);
  });

  it('AI view labels keep pt-BR as the default export', () => {
    expect(aiViewLabels('pt-BR').human).toBe('Humano');
    expect(aiViewLabels('en').human).toBe('Human');
    expect(aiViewLabels('en').ready).toBe('LLM ready');
  });

  it('404 page', async () => {
    const html = await render(NotFoundPage, { locale: 'en' });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('href="/en"');
    // LiveBar, AvailabilityPill and the palette still ship pt-BR until 14b/14c;
    // this task owns the 404 body inside <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(ptLeftovers(main)).toEqual([]);
  });
});

