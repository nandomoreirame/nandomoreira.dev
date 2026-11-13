import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NowPage from '../../src/components/pages/NowPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

process.env.SPOTIFY_CLIENT_ID ??= 'cid';
process.env.SPOTIFY_CLIENT_SECRET ??= 'sec';
process.env.SPOTIFY_REFRESH_TOKEN ??= 'ref';

const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(async () => {
  throw new Error('offline');
});

const render = async (locale: string) =>
  (await AstroContainer.create()).renderToString(NowPage, {
    props: { locale },
    request: new Request(locale === 'en' ? 'https://nandomoreira.dev/en/now' : 'https://nandomoreira.dev/now'),
  });

describe('NowPage', () => {
  beforeEach(() => {
    fetchImpl.mockReset();
    fetchImpl.mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the pt-BR now page byte for byte', async () => {
    // The dev build inlines absolute script paths; keep the snapshot machine independent.
    const html = (await render('pt-BR')).replaceAll(process.cwd(), '<root>');
    await expect(html).toMatchFileSnapshot('../__snapshots__/now.pt.html');
  });

  it('renders the English now page', async () => {
    const html = await render('en');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('"inLanguage":"en"');
    // Chrome still ships AvailabilityPill and the language suggestion in the
    // other language; this task owns the now body inside <main>.
    // ClosingCta and UpdatedAt stay pt-BR until later i18n passes.
    // Curated focus/studying copy, Portuguese posts and the GitHub card
    // (NowContributions / NowLastCommit) are out of this task's file list.
    const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const cleaned = main
      .replace(/<section\b[^>]*class="[^"]*\bmy-3xl\b[^"]*"[^>]*>[\s\S]*?<\/section>/i, '')
      .replace(/<a\b[^>]*data-availability-card[\s\S]*?<\/a>|<div\b[^>]*data-availability-card[\s\S]*?<\/div>/i, '')
      .replace(/<div\b[^>]*\bdata-page-updated\b[^>]*>[\s\S]*?<\/div>/i, '')
      .replace(/<div\b[^>]*\bdata-github-card\b[^>]*>[\s\S]*?<\/div>/i, '')
      .replace(/<section\b[^>]*aria-labelledby="foco"[^>]*>[\s\S]*?<\/section>/i, '')
      .replace(/<section\b[^>]*aria-labelledby="escrevendo"[^>]*>[\s\S]*?<\/section>/i, '')
      .replace(/<section\b[^>]*aria-labelledby="estudando"[^>]*>[\s\S]*?<\/section>/i, '')
      // The .com TLD of nownownow.com is not Portuguese.
      .replace(/nownownow\.com/gi, ' ');
    expect(ptLeftovers(cleaned)).toEqual([]);
  });
});
