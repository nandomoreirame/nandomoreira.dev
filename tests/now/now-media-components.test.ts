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
    items: ['Raul', 'Nando', 'Tim', 'Gal', 'Elis', 'Rita'].map((name, index) => ({
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
  it('renders six local artist photos and the album line, with no third-party image', async () => {
    const html = await render(NowMusic, { music: music() });
    const sources = [...html.matchAll(/<img\b[^>]*\bsrc="([^"]*)"/g)].map((match) => match[1]);

    expect(sources.filter((src) => src?.startsWith('/api/now/cover/spotify/'))).toHaveLength(7);
    expect(html).toContain('alt=""');
    expect(html).not.toMatch(/src="[^"]*(?:scdn\.co|s-microsoft\.com)/);
    expect(html).toContain('Artist A · Album One (1999)');
    expect(html).toContain('href="https://open.spotify.com/track/t1"');
    expect(html).toContain('Artistas do mês');
  });

  it('lays six artists in two full rows of three on a phone and in one row from sm', async () => {
    const html = await render(NowMusic, { music: music() });
    const grid = html.split('Artistas do mês')[1]?.match(/<ul\b[^>]*>/)?.[0] ?? '';

    expect(grid).toContain('grid-cols-3');
    expect(grid).toContain('sm:grid-cols-6');
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
          playingNow: {
            title: 'Red Dead Redemption 2',
            platforms: ['Xbox One', 'Xbox Series'],
            progress: score,
            url: 'https://www.xbox.com/pt-BR/games/store/-/BPSWGQBW7R3G',
          },
          recent: [game('Red Dead Redemption 2', score), game('Forza Horizon 5'), game('Starfield'), game('Hades'), game('Celeste')],
        },
      },
    });
    const grid = html.split('grid-cols-2')[1] ?? '';

    expect(html).toContain('Jogando agora');
    const featured = html.match(
      /<a\b[^>]*href="https:\/\/www\.xbox\.com\/pt-BR\/games\/store\/-\/BPSWGQBW7R3G"[^>]*>[\s\S]*?<\/a>/,
    )?.[0];
    expect(featured).toContain('Red Dead Redemption 2');
    expect(featured).toContain('690 / 1000 G');
    // A game the catalog does not know stays a card, never a link to a search page.
    expect(grid).toContain('Forza Horizon 5');
    expect(grid).not.toMatch(/<a\b[^>]*>[^]*?Forza Horizon 5/);
    expect(html).not.toContain('xbox.com/pt-BR/search');
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

  it('stretches the featured details across the card, with a thick bar at the bottom', async () => {
    const html = await render(NowGames, {
      games: { state: 'ok', items: { recent: [game('Hades', { current: 690, total: 1000, percent: 69 })] } },
    });
    const details = html.match(/<div[^>]*data-featured-details[^>]*>/)?.[0] ?? '';
    const bar = html.match(/<div[^>]*role="progressbar"[^>]*>/)?.[0] ?? '';
    const block = html.match(/<div[^>]*data-progress[^>]*>/)?.[0] ?? '';

    expect(details).toContain('flex-1');
    expect(bar).toContain('h-2.5');
    expect(block).toContain('mt-auto');
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

describe('NowGames fallback', () => {
  it('lists the curated games as plain text', async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(NowGames, {
      props: { games: { state: 'fallback', items: [{ name: 'Hades', note: 'zerado' }] } },
    });
    expect(html).toContain('Hades');
    expect(html).not.toContain('<a');
  });
});

describe('NowMusic preview button', () => {
  const withPreview = (): NowSnapshot['music'] => {
    const base = music();
    if (base.recent.state !== 'ok') throw new Error('fixture must be populated');
    base.recent.items = [
      { ...base.recent.items[0]!, preview: '/api/now/preview/GBUM70812423' },
      { ...base.recent.items[0]!, title: 'Sem prévia', url: 'https://open.spotify.com/track/t2' },
    ];
    return base;
  };

  it('puts a hidden, labelled toggle over the cover of a track Deezer can play', async () => {
    const html = await render(NowMusic, { music: withPreview() });
    const buttons = [...html.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);

    expect(buttons).toHaveLength(1);
    const button = buttons[0]!;
    expect(button).toContain('type="button"');
    expect(button).toContain('data-now-preview="/api/now/preview/GBUM70812423"');
    expect(button).toContain('aria-pressed="false"');
    expect(button).toContain('aria-label="Ouvir prévia de Same Song"');
    // Without JavaScript it never promises an action; the script reveals it.
    expect(button).toMatch(/\shidden(\s|>|=)/);
  });

  it('draws both icons so CSS can swap play for pause while it plays', async () => {
    const html = await render(NowMusic, { music: withPreview() });
    const button = html.match(/<button\b[\s\S]*?<\/button>/)?.[0] ?? '';
    expect(button.match(/<svg\b/g)).toHaveLength(2);
    expect(button).toContain('group-aria-pressed/preview:');
  });

  it('shows no Deezer credit under the tracks, even with previews (REQ-031 revoked)', async () => {
    const html = await render(NowMusic, { music: withPreview() });
    expect(html).not.toContain('Deezer');
  });

  it('never points the audio at Deezer', async () => {
    const html = await render(NowMusic, { music: withPreview() });
    expect(html).not.toContain('dzcdn.net');
    expect(html).not.toContain('api.deezer.com');
  });
});

describe('NowMusic artist previews', () => {
  const withArtistPreview = (): NowSnapshot['music'] => {
    const base = music();
    if (base.topArtists.state !== 'ok') throw new Error('fixture must be populated');
    base.topArtists.items[0] = {
      ...base.topArtists.items[0]!,
      preview: '/api/now/preview/BRWMB0101850',
      previewTitle: 'Metamorfose Ambulante',
    };
    return base;
  };

  it('turns the photo of an artist with a preview into the play toggle and keeps the name as the link', async () => {
    const html = await render(NowMusic, { music: withArtistPreview() });
    const artists = html.split('Artistas do mês')[1]?.split('</ul>')[0] ?? '';
    const button = artists.match(/<button\b[^>]*>/)?.[0] ?? '';

    expect(button).toContain('data-now-preview="/api/now/preview/BRWMB0101850"');
    expect(button).toContain('aria-label="Ouvir Metamorfose Ambulante, de Raul"');
    expect(button).toContain('aria-pressed="false"');
    expect(button).toContain('rounded-full');
    // No button inside a link: the name links to Spotify on its own.
    expect(artists).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<button/);
    expect(artists).toMatch(/<a\b[^>]*href="https:\/\/open\.spotify\.com\/artist\/raul"[^>]*>[\s\S]*?Raul[\s\S]*?<\/a>/);
  });

  it('keeps one button per previewable artist and none for the others', async () => {
    const html = await render(NowMusic, { music: withArtistPreview() });
    const artists = html.split('Artistas do mês')[1]?.split('</ul>')[0] ?? '';
    expect(artists.match(/<button\b/g)).toHaveLength(1);
  });

  it('shows no Deezer credit when only an artist has a preview', async () => {
    const html = await render(NowMusic, { music: withArtistPreview() });
    expect(html).not.toContain('Deezer');
  });
});
