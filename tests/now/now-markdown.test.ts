import { describe, expect, it } from 'vitest';
import type { Post } from '../../src/content/schemas/post';
import { renderMarkdown } from '../../src/lib/ai-view/render';
import { nowMarkdown } from '../../src/lib/now/markdown';
import { NOW_GAMES } from '../../src/lib/now/now';
import type { NowSnapshot } from '../../src/lib/now/load';
import { MACHINE_LEAKS } from '../helpers/machine-leaks';

const site = new URL('https://nandomoreira.dev');

const snapshot = (availability: string): NowSnapshot => ({
  projects: {
    state: 'ok',
    items: [
      {
        name: 'alpha',
        url: 'https://github.com/nandomoreirame/alpha',
        description: 'newest',
        language: 'TypeScript',
        pushedAt: '2026-10-10T12:00:00Z',
      },
    ],
  },
  music: {
    recent: {
      state: 'ok',
      items: [
        {
          title: 'Same Song',
          artists: 'Artist A',
          album: 'Album',
          url: 'https://open.spotify.com/track/t1',
          playedAt: '2026-10-11T12:00:00Z',
          day: 'hoje',
        },
      ],
    },
    topArtists: { state: 'empty' },
  },
  games: { state: 'fallback', items: NOW_GAMES },
  writing: {
    latest: { title: 'Post publicado', slug: 'post-publicado' } as Post,
    drafts: ['Rascunho sem link'],
  },
  focus: { items: ['Foco um'], availability },
  studying: [{ topic: 'Tema um', note: 'o porquê do tema', url: 'https://example.com/leitura' }],
  updatedAt: '2026-10-19',
  contributions: {
    state: 'ok',
    items: { total: 9497, weeks: [[{ date: '2026-03-12', count: 80, level: 4 }]], busiest: { date: '2026-03-12', count: 80 } },
  },
  lastCommit: {
    repo: 'nandomoreira.dev',
    message: 'feat: one thing',
    url: 'https://github.com/nandomoreirame/nandomoreira.dev/commit/1',
    committedAt: '2026-10-19T12:00:00Z',
  },
});

describe('nowMarkdown', () => {
  it('opens Trabalhando with the year on GitHub and the last commit', () => {
    const markdown = nowMarkdown({ site: new URL('https://nandomoreira.dev'), data: snapshot('x') });
    const section = markdown.split('## Trabalhando')[1]?.split('## ')[0] ?? '';
    expect(section).toContain('9.497 contribuições no GitHub no último ano');
    expect(section).toContain('Último commit: [feat: one thing](https://github.com/nandomoreirame/nandomoreira.dev/commit/1) em nandomoreira.dev, 19 de outubro de 2026.');
  });

  it('dates the view with the day the sources last moved', () => {
    expect(nowMarkdown({ site: new URL('https://nandomoreira.dev'), data: snapshot('x') })).toContain('updated: 2026-10-19');
  });

  it('lists the six sections in page order, with links only where a human can open them', () => {
    const markdown = nowMarkdown({ site, data: snapshot('Aberto a projetos.') });
    const headings = [...markdown.matchAll(/^## .+$/gm)].map(match => match[0]);

    expect(headings).toEqual([
      '## Foco',
      '## Trabalhando',
      '## Escrevendo',
      '## Estudando',
      '## Ouvindo',
      '## Jogando',
    ]);
    const foco = markdown.split('## Foco')[1]?.split('## Trabalhando')[0] ?? '';
    expect(foco).not.toContain('Recusando agora');
    expect(foco).toContain('Disponibilidade:');
    expect(markdown).toContain('title: Agora');
    expect(markdown).toContain('url: https://nandomoreira.dev/now');
    expect(markdown).toContain('https://github.com/nandomoreirame/alpha');
    expect(markdown).toContain('https://open.spotify.com/track/t1');
    expect(markdown).toContain('](https://nandomoreira.dev/post-publicado)');
    expect(markdown).not.toContain('/posts/');
    expect(markdown).toMatch(/^- Rascunho sem link$/m);
    expect(markdown).toMatch(/^- \[Tema um\]\(https:\/\/example\.com\/leitura\): o porquê do tema$/m);
    expect(markdown).not.toContain('[Rascunho sem link]');
    expect(markdown).not.toContain('TODO');
    expect(markdown.toLowerCase()).not.toContain('api');
  });

  it('replaces an empty section with a single line and strips an e-mail from availability', () => {
    const data = snapshot('Escreva para oi@nandomoreira.dev');
    data.projects = { state: 'empty' };
    data.music = { recent: { state: 'empty' }, topArtists: { state: 'empty' } };
    const markdown = nowMarkdown({ site, data });

    expect(markdown).toContain('Sem dados no momento.');
    for (const [label, pattern] of MACHINE_LEAKS) {
      expect(markdown, label).not.toMatch(pattern);
    }
  });

  it('escapes hostile API text and omits a description that leaks', () => {
    const data = snapshot('Aberto a projetos.');
    if (data.projects.state === 'empty' || data.music.recent.state === 'empty')
      throw new Error('fixture must be populated');
    data.projects.items[0]!.description = 'contato: x@y.com';
    data.music.recent.items[0]!.title = '<script>alert(1)</script>';
    const markdown = nowMarkdown({ site, data });
    const html = renderMarkdown(markdown);

    expect(markdown).not.toContain('<script');
    expect(markdown).not.toContain('x@y.com');
    for (const [label, pattern] of MACHINE_LEAKS) {
      expect(markdown, label).not.toMatch(pattern);
    }
    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror=');
  });

  it('prints artists, the album and gamerscore as text, never as an image', () => {
    const data = snapshot('Aberto a projetos.');
    data.music.topArtists = {
      state: 'ok',
      items: [{ name: 'Raul Seixas', url: 'https://open.spotify.com/artist/raul' }],
    };
    if (data.music.recent.state === 'empty') throw new Error('fixture must be populated');
    data.music.recent.items[0]!.album = 'Krig-ha';
    data.music.recent.items[0]!.year = '1990';
    data.games = {
      state: 'ok',
      items: {
        playingNow: {
          title: 'Hades',
          url: 'https://www.xbox.com/pt-BR/games/store/-/BPSWGQBW7R3G',
          platforms: ['PC'],
          progress: { current: 690, total: 1000, percent: 69 },
        },
        recent: [
          {
            name: 'Hades',
            lastPlayed: '2026-10-05',
            platforms: ['PC'],
            progress: { current: 690, total: 1000, percent: 69 },
          },
        ],
      },
    };
    const markdown = nowMarkdown({ site, data });

    expect(markdown).toContain('### Artistas do mês');
    expect(markdown).toContain('- [Raul Seixas](https://open.spotify.com/artist/raul)');
    expect(markdown).toContain('Krig-ha (1990).');
    expect(markdown).toContain('690 / 1000 G (69%)');
    expect(markdown).toContain('Jogando agora: [Hades](https://www.xbox.com/pt-BR/games/store/-/BPSWGQBW7R3G)');
    expect(markdown).toContain('- Hades, 2026-10-05');
    expect(markdown).not.toContain('xbox.com/pt-BR/search');
    expect(markdown).toContain('PC');
    expect(markdown).not.toContain('![');
  });

  it('escapes a hostile album before the markdown is rendered', () => {
    const data = snapshot('Aberto a projetos.');
    if (data.music.recent.state === 'empty') throw new Error('fixture must be populated');
    data.music.recent.items[0]!.album = '<img src=x onerror=alert(1)>';
    const html = renderMarkdown(nowMarkdown({ site, data }));

    expect(html).not.toContain('<img');
    expect(html).not.toMatch(/<[^>]*onerror=/);
    expect(html).toContain('&lt;img');
  });

  it('does not double the period after text that already ends a sentence', () => {
    const data = snapshot('Aberto a projetos.');
    if (data.projects.state === 'empty' || data.music.recent.state === 'empty')
      throw new Error('fixture must be populated');
    data.projects.items[0]!.description = 'CLI de dados.';
    data.music.recent.items[0]!.artists = 'Charlie Brown Jr.';
    const markdown = nowMarkdown({ site, data });

    expect(markdown).not.toContain('..');
    expect(markdown).toContain('Charlie Brown Jr. Album. hoje');
    expect(markdown).toContain('CLI de dados. TypeScript.');
  });
});
