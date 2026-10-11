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
    state: 'ok',
    items: [
      {
        title: 'Same Song',
        artists: 'Artist A',
        url: 'https://open.spotify.com/track/t1',
        playedAt: '2026-10-11T12:00:00Z',
        day: 'hoje',
      },
    ],
  },
  games: { state: 'fallback', items: NOW_GAMES },
  writing: {
    latest: { title: 'Post publicado', slug: 'post-publicado' } as Post,
    drafts: ['Rascunho sem link'],
  },
  focus: { items: ['Foco um'], declining: ['Declínio um'], availability },
});

describe('nowMarkdown', () => {
  it('lists the five sections in page order, with links only where a human can open them', () => {
    const markdown = nowMarkdown({ site, data: snapshot('Aberto a projetos.') });
    const headings = [...markdown.matchAll(/^## .+$/gm)].map((match) => match[0]);

    expect(headings).toEqual([
      '## Foco',
      '## Projetos em andamento',
      '## Escrevendo',
      '## Ouvindo',
      '## Jogando',
    ]);
    expect(markdown).toContain('title: Agora');
    expect(markdown).toContain('url: https://nandomoreira.dev/now');
    expect(markdown).toContain('https://github.com/nandomoreirame/alpha');
    expect(markdown).toContain('https://open.spotify.com/track/t1');
    expect(markdown).toContain('](https://nandomoreira.dev/posts/post-publicado)');
    expect(markdown).toMatch(/^- Rascunho sem link$/m);
    expect(markdown).not.toContain('[Rascunho sem link]');
    expect(markdown).not.toContain('TODO');
    expect(markdown.toLowerCase()).not.toContain('api');
  });

  it('replaces an empty section with a single line and strips an e-mail from availability', () => {
    const data = snapshot('Escreva para oi@nandomoreira.dev');
    data.projects = { state: 'empty' };
    data.music = { state: 'empty' };
    const markdown = nowMarkdown({ site, data });

    expect(markdown).toContain('Sem dados no momento.');
    for (const [label, pattern] of MACHINE_LEAKS) {
      expect(markdown, label).not.toMatch(pattern);
    }
  });

  it('escapes hostile API text and omits a description that leaks', () => {
    const data = snapshot('Aberto a projetos.');
    data.projects.items[0]!.description = 'contato: x@y.com';
    data.music.items[0]!.title = '<script>alert(1)</script>';
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
});
