import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import AboutPage from '../../src/components/pages/AboutPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(AboutPage, {
    props: { locale },
    request: new Request(
      locale === 'en' ? 'https://nandomoreira.dev/en/about' : 'https://nandomoreira.dev/sobre',
    ),
  });

describe('AboutPage', () => {
  it('keeps the pt-BR about page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/about.pt.html');
  });

  it('renders the English about page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the about body inside <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    // Proper names that legitimately carry Portuguese particles or a .com TLD.
    const cleaned = main
      .replace(/Colégio Estadual do Paraná/g, ' ')
      .replace(/MalaPronta\.com/gi, ' ');
    expect(ptLeftovers(cleaned)).toEqual([]);
  });

  it('formats periods in English', async () => {
    const html = await render('en');
    expect(html).toMatch(/Building software since 20\d\d/);
    expect(html).toContain('"@type":"ProfilePage"');
  });
});
