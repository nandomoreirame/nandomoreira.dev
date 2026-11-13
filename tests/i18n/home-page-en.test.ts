import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import HomePage from '../../src/components/pages/HomePage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(HomePage, {
    props: { locale },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en' : 'https://nandomoreira.dev/'),
  });

describe('HomePage', () => {
  it('keeps the pt-BR home byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/home.pt.html');
  });

  it('renders the English home', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the home body inside <main>.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    expect(ptLeftovers(main)).toEqual([]);
  });
});
