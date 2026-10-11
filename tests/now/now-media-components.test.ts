import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import NowGames from '../../src/components/now/NowGames.astro';
import NowMusic from '../../src/components/now/NowMusic.astro';
import type { NowSnapshot } from '../../src/lib/now/load';
import type { RecentGame } from '../../src/lib/now/xbox';

const render = async (component: unknown, props: Record<string, unknown>) => {
  const container = await AstroContainer.create();
  return container.renderToString(component as never, { props });
};

const cover = (id: string) => `/api/now/cover/spotify/${id}`;

const music = (): NowSnapshot['music'] => ({
  topArtists: {
    state: 'ok',
    items: ['Raul', 'Nando', 'Tim', 'Gal', 'Elis'].map((name, index) => ({
      name,
      url: `https://open.spotify.com/artist/${name.toLowerCase()}`,
      cover: cover(String(index + 1).repeat(40)),
    })),
  },
  recent: {
    state: 'ok',
    items: [
      {
        title: 'Same Song',
        artists: 'Artist A',
        album: 'Album One',
        year: '1999',
        cover: cover('b'.repeat(40)),
        url: 'https://open.spotify.com/track/t1',
        playedAt: '2026-10-11T12:00:00Z',
        day: 'hoje',
      },
    ],
  },
});

const game = (name: string, progress?: RecentGame['progress']): RecentGame => ({
  name,
  lastPlayed: '2026-10-05',
  platforms: ['Xbox Series'],
  cover: `/api/now/cover/xbox/apps.1.2.aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`,
  ...(progress ? { progress } : {}),
});

describe('NowMusic', () => {
  it('renders five local artist photos and the album line, with no third-party image', async () => {
    const html = await render(NowMusic, { music: music() });
    const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)].map((match) => match[1]);

    expect(sources.filter((src) => src?.startsWith('/api/now/cover/spotify/'))).toHaveLength(6);
    expect(html).toContain('alt=""');
    expect(html).not.toMatch(/src="[^"]*(?:scdn\.co|s-microsoft\.com)/);
    expect(html).toContain('Artist A · Album One (1999)');
    expect(html).toContain('Artistas do mês');
  });

  it('hides the artist block when that source is empty and still lists tracks', async () => {
    const data = music();
    data.topArtists = { state: 'empty' };
    const html = await render(NowMusic, { music: data });

    expect(html).not.toContain('Artistas do mês');
    expect(html).toContain('Same Song');
    expect(html).toContain('hoje');
  });

  it('says there is no data when the recent tracks are empty', async () => {
    const html = await render(NowMusic, {
      music: { recent: { state: 'empty' }, topArtists: { state: 'empty' } },
    });
    expect(html).toContain('Sem dados no momento.');
  });
});

describe('NowGames', () => {
  const score = { current: 690, total: 1000, percent: 69 };

  it('features the game being played and does not repeat it in the grid', async () => {
    const html = await render(NowGames, {
      games: {
        state: 'ok',
        items: {
          playingNow: { title: 'Red Dead Redemption 2', platforms: ['Xbox One', 'Xbox Series'], progress: score },
          recent: [game('Red Dead Redemption 2', score), game('Forza Horizon 5'), game('Starfield'), game('Hades'), game('Celeste')],
        },
      },
    });
    const grid = html.split('grid-cols-2')[1] ?? '';

    expect(html).toContain('Jogando agora');
    expect(html).not.toContain('Último jogado');
    expect(grid).not.toContain('Red Dead Redemption 2');
    expect(grid).toContain('Forza Horizon 5');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="69"');
    expect(html).toContain('690 / 1000 G · 69%');
    expect(html).not.toMatch(/src="[^"]*s-microsoft\.com/);
  });

  it('features the latest game when nothing is being played', async () => {
    const html = await render(NowGames, {
      games: {
        state: 'ok',
        items: { recent: [game('Hades'), game('Celeste')] },
      },
    });
    const grid = html.split('grid-cols-2')[1] ?? '';

    expect(html).toContain('Último jogado');
    expect(html).not.toContain('Jogando agora');
    expect(grid).not.toContain('>Hades<');
    expect(grid).toContain('Celeste');
  });

  it('omits the bar when a game has no gamerscore', async () => {
    const html = await render(NowGames, {
      games: { state: 'ok', items: { recent: [game('Celeste')] } },
    });
    expect(html).not.toContain('role="progressbar"');
  });

  it('keeps a curated list and an empty section free of cards', async () => {
    const fallback = await render(NowGames, {
      games: { state: 'fallback', items: [{ name: 'Hades', note: 'na reserva' }] },
    });
    const empty = await render(NowGames, { games: { state: 'empty' } });

    expect(fallback).toContain('Hades');
    expect(fallback).toContain('na reserva');
    expect(fallback).not.toContain('role="progressbar"');
    expect(fallback).not.toContain('/api/now/cover/');
    expect(empty).toContain('Sem dados no momento.');
  });
});
