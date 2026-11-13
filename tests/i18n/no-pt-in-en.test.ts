import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AboutPage from '../../src/components/pages/AboutPage.astro';
import CollectionPage from '../../src/components/pages/CollectionPage.astro';
import ContactPage from '../../src/components/pages/ContactPage.astro';
import HomePage from '../../src/components/pages/HomePage.astro';
import McpPage from '../../src/components/pages/McpPage.astro';
import NotFoundPage from '../../src/components/pages/NotFoundPage.astro';
import NowPage from '../../src/components/pages/NowPage.astro';
import PostsPage from '../../src/components/pages/PostsPage.astro';
import PrivacyPage from '../../src/components/pages/PrivacyPage.astro';
import ResumePage from '../../src/components/pages/ResumePage.astro';
import SetupPage from '../../src/components/pages/SetupPage.astro';
import { ptLeftovers } from '../helpers/pt-leftovers';

process.env.SPOTIFY_CLIENT_ID ??= 'cid';
process.env.SPOTIFY_CLIENT_SECRET ??= 'sec';
process.env.SPOTIFY_REFRESH_TOKEN ??= 'ref';

const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(async () => {
  throw new Error('offline');
});

const PAGES = [
  ['/en', HomePage, {}],
  ['/en/about', AboutPage, {}],
  ['/en/contact', ContactPage, {}],
  ['/en/resume', ResumePage, {}],
  ['/en/mcp', McpPage, {}],
  ['/en/setup', SetupPage, {}],
  ['/en/now', NowPage, {}],
  ['/en/privacy', PrivacyPage, {}],
  ['/en/posts', PostsPage, {}],
  ['/en/portfolio', CollectionPage, { collection: 'portfolio' }],
  ['/en/lab', CollectionPage, { collection: 'lab' }],
  ['/en/missing', NotFoundPage, {}],
] as const;

/** Drop intentional Portuguese that is not interface copy (REQ-008). */
const withoutIntentionalContent = (url: string, html: string): string => {
  let out = html;
  // When EN_LIVE is on, the suggestion is written in the other language by design (REQ-018).
  out = out.replace(/<aside\b[^>]*\bdata-lang-suggest\b[^>]*>[\s\S]*?<\/aside>/gi, ' ');
  if (url === '/en/resume') {
    // Sheet body matches the Portuguese PDF (see resume-page-en). Nested
    // <article> tags inside each job make a single-article strip miss the sheet.
    out = out.replace(/<main\b[^>]*>[\s\S]*?<\/main>/i, ' ');
  }
  if (url === '/en/now') {
    // Curated focus/studying copy stays Portuguese until a content pass.
    out = out.replace(/<section\b[^>]*aria-labelledby="foco"[^>]*>[\s\S]*?<\/section>/i, ' ');
    out = out.replace(/<section\b[^>]*aria-labelledby="estudando"[^>]*>[\s\S]*?<\/section>/i, ' ');
  }
  return out;
};

describe('English pages carry no Portuguese interface text', () => {
  beforeEach(() => {
    fetchImpl.mockReset();
    fetchImpl.mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(PAGES)('%s', async (url, component, props) => {
    const html = await (
      await AstroContainer.create()
    ).renderToString(component as never, {
      props: { ...props, locale: 'en' },
      request: new Request(`https://nandomoreira.dev${url}`),
    });
    expect(ptLeftovers(withoutIntentionalContent(url, html))).toEqual([]);
  });

  it('proves the gate can fail', () => {
    expect(ptLeftovers('<p>Ver todos</p>')).not.toEqual([]);
  });
});
