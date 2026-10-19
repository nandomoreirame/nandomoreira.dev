import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { NOW_GAME_EXCLUDE } from '../../src/lib/now/now';
import { fetchXbox, parsePresence, parseRecentGames, xboxStoreUrl } from '../../src/lib/now/xbox';

const readJson = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

const webPresence = readJson('xbl-presence.json');
const history = readJson('xbl-title-history.json');

const playing = (type: string, name: string) => ({
  content: {
    state: 'Online',
    devices: [{ type, titles: [{ name, placement: 'Full', state: 'Active' }] }],
  },
});

const gamesBeforeCut = () => parseRecentGames(history, { limit: 50, exclude: NOW_GAME_EXCLUDE });

describe('parsePresence', () => {
  it('returns the full-screen title on a console when that game is in the history', () => {
    expect(parsePresence(playing('Scarlett', 'Halo Infinite'), gamesBeforeCut())).toEqual({
      title: 'Halo Infinite',
      platforms: ['Xbox Series', 'Xbox One'],
      cover:
        '/api/now/cover/xbox/apps.46694.68182501197884443.ac728a87-7bc1-4a0d-8bc6-0123456789ab.0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
      progress: { current: 690, total: 1000, percent: 69 },
    });
  });

  it('ignores a Web device whose title name is empty', () => {
    expect(parsePresence(webPresence, gamesBeforeCut())).toBeUndefined();
  });

  it('ignores a title that is not in the history, such as Home', () => {
    expect(parsePresence(playing('Scarlett', 'Home'), gamesBeforeCut())).toBeUndefined();
  });

  it('ignores a game the history filter already removed', () => {
    expect(parsePresence(playing('Scarlett', 'Microsoft Jewel'), gamesBeforeCut())).toBeUndefined();
  });

  it('copies cover, platforms and progress from the matched history game', () => {
    const xboxId =
      'apps.46694.68182501197884443.ac728a87-7bc1-4a0d-8bc6-0123456789ab.0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';
    const recent = parseRecentGames({
      content: {
        titles: [
          {
            name: 'Red Dead Redemption 2',
            type: 'Game',
            titleHistory: { lastTimePlayed: '2026-10-11T20:00:00Z' },
            displayImage: `https://store-images.s-microsoft.com/image/${xboxId}`,
            devices: ['XboxSeries', 'PC'],
            achievement: { currentGamerscore: 690, totalGamerscore: 1000, progressPercentage: 69 },
          },
        ],
      },
    });

    expect(parsePresence(playing('Scarlett', 'Red Dead Redemption 2'), recent)).toEqual({
      title: 'Red Dead Redemption 2',
      platforms: ['Xbox Series', 'PC'],
      cover: `/api/now/cover/xbox/${xboxId}`,
      progress: { current: 690, total: 1000, percent: 69 },
    });
  });
});

describe('parseRecentGames', () => {
  it('drops apps and Microsoft Jewel, then keeps five games with the next one filling the gap', () => {
    const recent = parseRecentGames(history, { exclude: NOW_GAME_EXCLUDE });
    expect(recent.map(game => game.name)).toEqual([
      'Halo Infinite',
      'Forza Horizon 5',
      'Starfield',
      'Age of Empires IV',
      'Hades',
    ]);
    expect(recent.map(game => game.lastPlayed)).toEqual([
      '2026-10-11',
      '2026-10-09',
      '2026-10-08',
      '2026-10-07',
      '2026-10-06',
    ]);
  });

  it('records the last played day in Sao Paulo, not UTC', () => {
    const recent = parseRecentGames({
      content: {
        titles: [
          {
            name: 'Hades',
            type: 'Game',
            titleHistory: { lastTimePlayed: '2026-10-12T01:00:00Z' },
          },
        ],
      },
    });
    expect(recent).toEqual([{ name: 'Hades', lastPlayed: '2026-10-11', platforms: [] }]);
  });

  it('drops a broken title in the middle and still returns five games', () => {
    const game = (name: string, iso: string) => ({
      name,
      type: 'Game',
      titleHistory: { lastTimePlayed: iso },
    });
    const recent = parseRecentGames({
      content: {
        titles: [
          game('One', '2026-10-11T20:00:00Z'),
          game('Two', '2026-10-10T20:00:00Z'),
          { name: 'Broken', type: 'Game', titleHistory: null },
          game('Three', '2026-10-09T20:00:00Z'),
          { name: 'Dated', type: 'Game', titleHistory: { lastTimePlayed: 'ontem' } },
          game('Four', '2026-10-08T20:00:00Z'),
          game('Five', '2026-10-07T20:00:00Z'),
          game('Six', '2026-10-06T20:00:00Z'),
        ],
      },
    });

    expect(recent.map(item => item.name)).toEqual(['One', 'Two', 'Three', 'Four', 'Five']);
  });

  it('keeps a local cover, known platforms and gamerscore, and drops a zero total', () => {
    const xboxId =
      'apps.46694.68182501197884443.ac728a87-7bc1-4a0d-8bc6-0123456789ab.0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0';
    const game = (
      achievement: { currentGamerscore: number; totalGamerscore: number; progressPercentage: number },
      image: string,
    ) => ({
      name: 'Red Dead Redemption 2',
      type: 'Game',
      titleHistory: { lastTimePlayed: '2026-10-11T20:00:00Z' },
      displayImage: image,
      devices: ['XboxOne', 'XboxSeries', 'XboxOne', 'Mystery'],
      achievement,
    });

    const [withScore] = parseRecentGames({
      content: {
        titles: [
          game(
            { currentGamerscore: 690, totalGamerscore: 1000, progressPercentage: 69.4 },
            `http://store-images.s-microsoft.com/image/${xboxId}`,
          ),
        ],
      },
    });

    expect(withScore?.progress).toEqual({ current: 690, total: 1000, percent: 69 });
    expect(withScore?.platforms).toEqual(['Xbox One', 'Xbox Series']);
    expect(withScore?.cover).toBe(`/api/now/cover/xbox/${xboxId}`);
    expect(JSON.stringify(withScore)).not.toContain('store-images');

    const [zero] = parseRecentGames({
      content: {
        titles: [
          game({ currentGamerscore: 0, totalGamerscore: 0, progressPercentage: 0 }, 'https://evil.example/image/x'),
        ],
      },
    });
    expect(zero?.progress).toBeUndefined();
    expect(zero?.cover).toBeUndefined();

    const [clamped] = parseRecentGames({
      content: {
        titles: [
          game({ currentGamerscore: 10, totalGamerscore: 10, progressPercentage: 140.6 }, 'https://evil.example/nope'),
        ],
      },
    });
    expect(clamped?.progress?.percent).toBe(100);
  });

  it('matches excluded names without case', () => {
    const recent = parseRecentGames(
      {
        content: {
          titles: [
            {
              name: 'microsoft jewel',
              type: 'Game',
              titleHistory: { lastTimePlayed: '2026-10-11T20:00:00.000Z' },
            },
            {
              name: 'Hades',
              type: 'Game',
              titleHistory: { lastTimePlayed: '2026-10-06T20:00:00.000Z' },
            },
          ],
        },
      },
      { exclude: ['Microsoft Jewel'] },
    );
    expect(recent.map(game => game.name)).toEqual(['Hades']);
  });
});

describe('xboxStoreUrl', () => {
  it('links a Microsoft Store product id, whatever its first character', () => {
    expect(xboxStoreUrl('BPSWGQBW7R3G')).toBe('https://www.xbox.com/pt-BR/games/store/-/BPSWGQBW7R3G');
    expect(xboxStoreUrl('9P079R5LGV4T')).toBe('https://www.xbox.com/pt-BR/games/store/-/9P079R5LGV4T');
  });

  it('gives no link without a valid product id', () => {
    for (const id of [undefined, '', '591405932', 'bpswgqbw7r3g', 'BPSWGQBW7R3G/../x', 'BPSWGQBW7R3']) {
      expect(xboxStoreUrl(id), String(id)).toBeUndefined();
    }
  });
});

describe('fetchXbox', () => {
  it('reads presence and title history in parallel and applies the same filters', async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      expect(new Headers(init?.headers).get('x-authorization')).toBe('key-1');
      if (String(url) === 'https://api.xbl.io/v2/presence') {
        return { ok: true, status: 200, json: async () => playing('Scarlett', 'Halo Infinite') };
      }
      if (String(url) === 'https://api.xbl.io/v2/player/titleHistory') {
        return { ok: true, status: 200, json: async () => history };
      }
      throw new Error(`unexpected ${url}`);
    });

    const result = await fetchXbox({
      fetch: fetchImpl as unknown as typeof fetch,
      apiKey: 'key-1',
      productIds: new Map(),
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result.playingNow).toEqual({
      title: 'Halo Infinite',
      platforms: ['Xbox Series', 'Xbox One'],
      cover:
        '/api/now/cover/xbox/apps.46694.68182501197884443.ac728a87-7bc1-4a0d-8bc6-0123456789ab.0f1e2d3c-4b5a-6978-8796-a5b4c3d2e1f0',
      progress: { current: 690, total: 1000, percent: 69 },
    });
    expect(result.recent).toHaveLength(5);
    expect(result.recent.map(game => game.name)).not.toContain('Microsoft Jewel');
  });

  // Node's fetch sends `Accept-Language: *` when none is set, and titleHistory
  // answers 200 with an error string in `content` instead of the titles.
  it('sends a concrete Accept-Language on both calls', async () => {
    const languages: Array<string | null> = [];
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      languages.push(new Headers(init?.headers).get('accept-language'));
      return {
        ok: true,
        status: 200,
        json: async () => (String(url).endsWith('/presence') ? playing('Scarlett', 'Halo Infinite') : history),
      };
    });

    await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'key-1', productIds: new Map() });

    expect(languages).toEqual(['pt-BR', 'pt-BR']);
  });
});

describe('fetchXbox store links', () => {
  const titled = (name: string, titleId: string, at: string) => ({
    name,
    type: 'Game',
    titleId,
    titleHistory: { lastTimePlayed: at },
  });
  const historyWithIds = {
    content: {
      titles: [
        titled('Red Dead Redemption 2', '591405932', '2026-10-11T15:00:00Z'),
        titled('Jogo Sem Loja', '111', '2026-10-10T15:00:00Z'),
      ],
    },
  };
  const CATALOG = 'https://displaycatalog.mp.microsoft.com/v7.0/products/lookup';

  const fakeFetch = (catalog: (titleId: string) => unknown) =>
    vi.fn(async (url: string, _init?: RequestInit) => {
      const target = String(url);
      if (target.endsWith('/presence'))
        return { ok: true, status: 200, json: async () => playing('Scarlett', 'Red Dead Redemption 2') };
      if (target.endsWith('/titleHistory')) return { ok: true, status: 200, json: async () => historyWithIds };
      if (target.startsWith(CATALOG)) {
        const titleId = new URL(target).searchParams.get('value') ?? '';
        const body = catalog(titleId);
        if (body instanceof Error) throw body;
        return { ok: true, status: 200, json: async () => body };
      }
      throw new Error(`unexpected ${target}`);
    });

  it('links a game to its store page through the catalog and leaves the rest unlinked', async () => {
    const fetchImpl = fakeFetch(titleId =>
      titleId === '591405932' ? { Products: [{ ProductId: 'BPSWGQBW7R3G' }] } : { Products: [] },
    );

    const result = await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'k', productIds: new Map() });

    const store = 'https://www.xbox.com/pt-BR/games/store/-/BPSWGQBW7R3G';
    expect(result.playingNow?.url).toBe(store);
    expect(result.recent[0]?.url).toBe(store);
    expect(result.recent[1]?.name).toBe('Jogo Sem Loja');
    expect(result.recent[1]?.url).toBeUndefined();
    const lookup = fetchImpl.mock.calls.find(([url]) => String(url).startsWith(CATALOG))?.[0];
    expect(String(lookup)).toContain('alternateId=XboxTitleId');
    expect(String(lookup)).toContain('market=BR');
  });

  it('asks the catalog once per title, then answers from the cache', async () => {
    const productIds = new Map<string, string | null>();
    const fetchImpl = fakeFetch(titleId =>
      titleId === '591405932' ? { Products: [{ ProductId: 'BPSWGQBW7R3G' }] } : { Products: [] },
    );

    await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'k', productIds });
    await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'k', productIds });

    const lookups = fetchImpl.mock.calls.filter(([url]) => String(url).startsWith(CATALOG));
    expect(lookups).toHaveLength(2);
  });

  it('keeps the games, without links, when the catalog fails, and retries next time', async () => {
    const productIds = new Map<string, string | null>();
    const fetchImpl = fakeFetch(() => new Error('catalog down'));

    const result = await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'k', productIds });

    expect(result.recent).toHaveLength(2);
    expect(result.recent.every(game => game.url === undefined)).toBe(true);
    expect(productIds.size).toBe(0);
  });

  it('ignores a catalog answer that is not a store product id', async () => {
    const fetchImpl = fakeFetch(() => ({ Products: [{ ProductId: 'javascript:alert(1)' }] }));

    const result = await fetchXbox({ fetch: fetchImpl as unknown as typeof fetch, apiKey: 'k', productIds: new Map() });

    expect(result.recent.every(game => game.url === undefined)).toBe(true);
  });
});
