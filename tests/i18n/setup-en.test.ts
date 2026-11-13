import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import SetupPage from '../../src/components/pages/SetupPage.astro';
import { SETUP_SECTIONS } from '../../src/lib/setup/setup';
import { SETUP_SECTIONS_EN, setupFor } from '../../src/lib/setup/setup-en';
import { ptLeftovers } from '../helpers/pt-leftovers';

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(SetupPage, {
    props: { locale },
    request: new Request(
      locale === 'en' ? 'https://nandomoreira.dev/en/setup' : 'https://nandomoreira.dev/setup',
    ),
  });

describe('English setup', () => {
  it('has the same sections, items, URLs and shortcuts in the same order', () => {
    const shape = (sections: typeof SETUP_SECTIONS) =>
      sections.map((section) => ({
        id: section.id,
        items: section.items.map((item) => ({
          name: item.name,
          url: item.url,
          keys: item.shortcuts?.map((shortcut) => shortcut.keys),
        })),
      }));
    expect(shape(SETUP_SECTIONS_EN)).toEqual(shape(SETUP_SECTIONS));
  });

  it('is translated and resolves by locale', () => {
    expect(setupFor('pt-BR').sections).toBe(SETUP_SECTIONS);
    expect(setupFor('en').sections).toBe(SETUP_SECTIONS_EN);
    expect(setupFor('en').lead).not.toBe(setupFor('pt-BR').lead);
  });
});

describe('SetupPage', () => {
  it('keeps the pt-BR setup page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/setup.pt.html');
  });

  it('renders the English setup page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the setup body inside <main>.
    // UpdatedAt date copy is still pt-BR.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const withoutChrome = main.replace(/<div\b[^>]*\bdata-page-updated\b[^>]*>[\s\S]*?<\/div>/i, '');
    // Product names keep Portuguese particles by design (shape parity with pt-BR).
    const cleaned = withoutChrome
      .replace(/Mesa ErgoDesk com regulagem de altura/g, ' ')
      .replace(/Zsh com Oh My Zsh/g, ' ')
      .replace(/Gemini no fluxo de implementação/g, ' ');
    expect(ptLeftovers(cleaned)).toEqual([]);
  });
});
