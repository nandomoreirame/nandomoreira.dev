import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ContactPage from '../../src/components/pages/ContactPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string, query = '') =>
  (await AstroContainer.create()).renderToString(ContactPage, {
    props: { locale },
    request: new Request(
      locale === 'en' ? `https://nandomoreira.dev/en/contact${query}` : `https://nandomoreira.dev/contato${query}`,
    ),
  });

describe('ContactPage', () => {
  it('keeps the pt-BR contact page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/contact.pt.html');
  });

  it('renders the English contact page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill in Portuguese; this task owns the
    // contact body inside <main>. AvailabilityCard stays Portuguese until a
    // shared availability i18n pass (same pattern as ClosingCta on about).
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const withoutAvailability = main.replace(
      /<a\b[^>]*data-availability-card[\s\S]*?<\/a>|<div\b[^>]*data-availability-card[\s\S]*?<\/div>/i,
      '',
    );
    expect(ptLeftovers(withoutAvailability)).toEqual([]);
  });

  it('posts the English form with its own origin and shows outcomes in English', async () => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(ContactPage, {
      props: { locale: 'en' },
      request: new Request('https://nandomoreira.dev/en/contact?envio=invalido'),
    });
    expect(html).toContain('action="/api/hire?origem=contact-en"');
    expect(html).toMatch(/role="alert"/);
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const withoutAvailability = main.replace(
      /<a\b[^>]*data-availability-card[\s\S]*?<\/a>|<div\b[^>]*data-availability-card[\s\S]*?<\/div>/i,
      '',
    );
    expect(ptLeftovers(withoutAvailability)).toEqual([]);
  });
});
