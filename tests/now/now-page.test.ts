import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getCurrentPosts, getUpcomingPosts } from '../../src/lib/content';
import { NOW_DECLINING, NOW_STUDYING, NOW_UPDATED_AT } from '../../src/lib/now/now';
import NowPage from '../../src/pages/now.astro';
import SetupPage from '../../src/pages/setup.astro';

process.env.SPOTIFY_CLIENT_ID ??= 'cid';
process.env.SPOTIFY_CLIENT_SECRET ??= 'sec';
process.env.SPOTIFY_REFRESH_TOKEN ??= 'ref';

const fetchImpl = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>(async () => {
  throw new Error('offline');
});

const render = async (page: typeof NowPage) => {
  const container = await AstroContainer.create();
  return container.renderToString(page);
};

const visibleText = (html: string): string => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');

const headings = (html: string): string[] =>
  [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>/g)].map((match) =>
    (match[1] ?? '')
      .replace(/<span[^>]*aria-hidden="true"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );

describe('/now page', () => {
  beforeEach(() => {
    fetchImpl.mockReset();
    fetchImpl.mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('keeps separators against the previous word and dates pushes in Sao Paulo', async () => {
    // The fixtures are dated 2026-10-11 and "hoje" is relative: freeze the clock
    // on that day, or the test turns red the day after it was written.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-11T15:00:00Z'));
    fetchImpl.mockImplementation(async (url: string) => {
      const target = String(url);
      if (target.includes('api.github.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => [
            {
              name: 'alpha',
              html_url: 'https://github.com/nandomoreirame/alpha',
              description: 'newest.',
              language: 'TypeScript',
              pushed_at: '2026-10-12T01:30:00Z',
              fork: false,
              archived: false,
              private: false,
            },
          ],
        };
      }
      if (target.includes('accounts.spotify.com')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'access-1' }) };
      }
      if (target.includes('/top/artists')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                name: 'Raul',
                external_urls: { spotify: 'https://open.spotify.com/artist/raul' },
                images: [{ url: `https://i.scdn.co/image/${'c'.repeat(40)}`, width: 320, height: 320 }],
              },
            ],
          }),
        };
      }
      if (target.includes('api.spotify.com')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                played_at: '2026-10-11T12:00:00Z',
                track: {
                  id: 't1',
                  name: 'Same Song',
                  artists: [{ name: 'Artist A Jr.' }],
                  album: {
                    name: 'Album',
                    release_date: '1999',
                    images: [{ url: `https://i.scdn.co/image/${'b'.repeat(40)}`, width: 300, height: 300 }],
                  },
                  external_urls: { spotify: 'https://open.spotify.com/track/t1' },
                },
              },
            ],
          }),
        };
      }
      throw new Error(`unexpected ${target}`);
    });

    const html = await render(NowPage);
    const text = visibleText(html.split('<article')[1]?.split('</article>')[0] ?? '');
    expect(text).not.toContain(' ,');
    expect(text).not.toContain(' :');
    // A stray period before a space or the end; ".NET" in Estudando is a name, not a separator.
    expect(text).not.toMatch(/ \.(\s|$)/);
    // A description or an artist that already ends in a period gets no second one.
    expect(text).not.toContain('..');
    // The recent tracks left the page (2026-10-16); only the artists stay.
    expect(text).not.toContain('Artist A Jr. · Album (1999)');
    expect(text).toContain('11 de outubro');
    expect(html).toContain('/api/now/cover/spotify/');
    expect(html).not.toContain('scdn.co');
    expect(html).not.toContain('s-microsoft.com');
  });

  it('renders the six sections in order, the update date, and the games fallback', async () => {
    const html = await render(NowPage);
    expect(headings(html)).toEqual([
      'Foco',
      'Projetos em andamento',
      'Escrevendo',
      'Estudando',
      'Ouvindo',
      'Jogando',
      'O que é uma página Agora?',
    ]);
    expect(html).toContain('Atualizada em');
    expect(html).toContain(`datetime="${NOW_UPDATED_AT}"`);
    const playing = html.split('id="jogando"')[1]?.split('</section>')[0] ?? '';
    expect(playing).toContain('Sem dados no momento.');
  });

  it('lists each study with its reading, opened outside the site', async () => {
    const html = await render(NowPage);
    const studying = html.split('id="estudando"')[1]?.split('</section>')[0] ?? '';

    for (const study of NOW_STUDYING) {
      const link = studying.match(new RegExp(`<a[^>]*href="${study.url.replace(/[.?+]/g, '\\$&')}"[^>]*>`))?.[0] ?? '';
      expect(link, study.topic).toContain('rel="nofollow noopener noreferrer"');
      expect(studying).toContain(study.topic);
      expect(studying).toContain(study.note);
    }
  });

  it('labels what is being declined inside Foco', async () => {
    const html = await render(NowPage);
    const foco = html.split('id="foco"')[1]?.split('id="projetos"')[0] ?? '';
    const heading = foco.indexOf('>Recusando agora<');
    const declining = foco.indexOf(NOW_DECLINING[0]!);

    expect(foco).toContain('<h3');
    expect(heading).toBeGreaterThan(-1);
    expect(declining).toBeGreaterThan(heading);
  });

  it('shows the availability with the shared AvailabilityCard, after what is declined', async () => {
    const html = await render(NowPage);
    const foco = html.split('id="foco"')[1]?.split('id="projetos"')[0] ?? '';
    expect(foco).not.toContain('data-alert');
    expect(foco).toContain('data-availability-card');
    expect(foco).toContain('data-status-dot');
    expect(foco.indexOf('data-availability-card')).toBeGreaterThan(foco.indexOf('>Recusando agora<'));
  });

  it('links the latest post at /slug and never under /posts', async () => {
    const latest = (await getCurrentPosts()).find((post) => post.draft !== true);
    const html = await render(NowPage);
    const writing = html.split('id="escrevendo"')[1]?.split('id="estudando"')[0] ?? '';

    expect(latest).toBeDefined();
    expect(writing).toContain(`href="/${latest!.slug}"`);
    expect(writing).not.toContain('/posts/');
  });

  it('lists draft titles without a link', async () => {
    const drafts = (await getUpcomingPosts()).slice(0, 5);
    const html = await render(NowPage);
    const writing = html.split('id="escrevendo"')[1]?.split('id="estudando"')[0] ?? '';

    expect(drafts.length).toBeGreaterThan(0);
    for (const draft of drafts) {
      expect(writing).toContain(draft.title);
      const title = draft.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(writing).not.toMatch(new RegExp(`<a\\b[^>]*>[\\s\\S]*?${title}[\\s\\S]*?</a>`));
    }
  });

  // The audio preview is the one script /now adds (REQ-027); anything else is a regression.
  // The container renders component scripts by source; the build gate checks their bodies.
  it('adds exactly one script beyond the layout ones, and it is the audio preview', async () => {
    const nowHtml = await render(NowPage);
    const setupHtml = await render(SetupPage);
    const sources = (html: string) =>
      [...html.matchAll(/<script\b(?![^>]*application\/ld\+json)[^>]*>/gi)].map((match) => match[0]);
    const extra = sources(nowHtml).filter((tag) => !sources(setupHtml).includes(tag));
    expect(extra).toHaveLength(1);
    expect(extra[0]).toContain('components/now/NowMusic.astro?astro&type=script');
  });

  it('is server rendered and cacheable for five minutes at the edge', () => {
    const source = readFileSync('src/pages/now.astro', 'utf8');
    expect(source).not.toContain('prerender');
    expect(source).toContain('s-maxage=300');
    expect(source).not.toContain('client:');
  });
});

describe('/now section headings', () => {
  // Numbered sections take their size from SectionHeader (text-h3). The closing
  // note is an eyebrow, not a seventh section.
  it('styles every section h2 itself, inside or outside Prose', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const container = await AstroContainer.create();
    const html = await container.renderToString(NowPage);
    vi.unstubAllGlobals();
    const h2s = [...html.matchAll(/<h2\b[^>]*>/g)].map((match) => match[0]);
    expect(h2s).toHaveLength(7);
    for (const tag of h2s.slice(0, 6)) expect(tag).toContain('text-h3');
    expect(h2s[6]).toContain('tracking-eyebrow');
  });
});

describe('section index on /now and /setup', () => {
  beforeEach(() => {
    fetchImpl.mockReset();
    fetchImpl.mockRejectedValue(new Error('offline'));
    vi.stubGlobal('fetch', fetchImpl);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['/now', NowPage],
    ['/setup', SetupPage],
  ])('%s has the post index card, linking every section, in a sticky side column', async (_route, page) => {
    const html = await render(page);
    const nav = html.match(/<nav[^>]*data-toc[^>]*>[\s\S]*?<\/nav>/)?.[0] ?? '';
    const sections = [...html.matchAll(/<section aria-labelledby="([^"]+)"/g)].map((match) => match[1]);

    expect(nav).toContain('Índice');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    for (const id of sections) expect(nav).toContain(`href="#${id}"`);
    const aside = html.match(/<aside[^>]*data-toc-aside[^>]*>/)?.[0] ?? '';
    for (const name of ['md:sticky', 'md:top-3xl', 'md:self-start']) expect(aside).toContain(name);
    expect(html).toMatch(/<button[^>]*popovertarget="post-toc"/);
  });

  it('keeps the popover out of a display:none wrapper below md', async () => {
    const html = await render(SetupPage);
    const aside = html.match(/<aside[^>]*data-toc-aside[^>]*>/)?.[0] ?? '';
    expect(aside).toContain('contents');
    expect(aside).not.toMatch(/class="[^"]*(?<![:\w-])hidden\b/);
  });
});
