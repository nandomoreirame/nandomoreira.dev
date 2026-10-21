import { describe, expect, it } from 'vitest';
import { move, viewFor } from '../../src/lib/search/controller';
import type { SearchItem } from '../../src/lib/search/build-index';

const index: SearchItem[] = [
  { kind: 'archive', title: 'Homelab antigo', path: '/velho' },
  { kind: 'post', title: 'Meu homelab', path: '/homelab', keywords: ['linux'] },
  { kind: 'case', title: 'Forja', path: '/lab/forja' },
];

describe('palette view', () => {
  it('shows General then Go to on an empty query', () => {
    expect(viewFor(index, '').map(group => group.label)).toEqual(['Geral', 'Ir para']);
  });

  it('groups hits by kind, archive always last, best score first', () => {
    const groups = viewFor(index, 'homelab');
    expect(groups.map(group => group.label)).toEqual(['Posts', 'Arquivo']);
  });

  it('sends "Enviar e-mail" to the contact page', () => {
    const general = viewFor(index, '')[0]?.options ?? [];
    expect(general.find(option => option.label === 'Enviar e-mail')?.href).toBe('/contato');
  });

  it('offers the page markdown and AI view in General when the page has them', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', aiPath: '/sobre/ia' })[0]?.options ?? [];
    expect(general.map(option => [option.label, option.href])).toEqual([
      ['Copiar link', undefined],
      ['Enviar e-mail', '/contato'],
      ['Código-fonte', 'https://github.com/nandomoreirame/nandomoreira.dev'],
      ['Versão .md', '/sobre.md'],
      ['Versão para IA', '/sobre/ia'],
    ]);
    expect(viewFor(index, 'md', { mdPath: '/sobre.md' })[0]?.options[0]?.href).toBe('/sobre.md');
  });

  it('offers the human version instead while on the AI view', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', humanPath: '/sobre' })[0]?.options ?? [];
    expect(general.map(option => [option.label, option.href]).slice(3)).toEqual([
      ['Versão .md', '/sobre.md'],
      ['Versão para humanos', '/sobre'],
    ]);
  });

  it('shows each General action with its one-letter shortcut', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', aiPath: '/sobre/ia' })[0]?.options ?? [];
    expect(general.map(option => option.keys)).toEqual([['L'], ['E'], ['S'], ['M'], ['I']]);
    const human = viewFor(index, '', { humanPath: '/sobre' })[0]?.options.at(-1);
    expect(human?.keys).toEqual(['I']);
  });

  it('opens the source code of the site on GitHub in a new tab, after the e-mail, on S', () => {
    const general = viewFor(index, '')[0]?.options ?? [];
    expect(general[2]).toEqual({
      id: 'opt-source',
      label: 'Código-fonte',
      href: 'https://github.com/nandomoreirame/nandomoreira.dev',
      newTab: true,
      keys: ['S'],
    });
  });

  it('leaves them out on a page without those views', () => {
    const labels = (viewFor(index, '')[0]?.options ?? []).map(option => option.label);
    expect(labels).not.toContain('Versão .md');
    expect(labels).not.toContain('Versão para IA');
    expect(labels).not.toContain('Versão para humanos');
  });

  it('filters actions and destinations too', () => {
    const groups = viewFor(index, 'copiar');
    expect(groups[0]?.options[0]?.label).toBe('Copiar link');
  });

  it('offers the contact when nothing matches', () => {
    const groups = viewFor(index, 'zzzz');
    expect(groups).toHaveLength(1);
    expect(groups[0]?.options[0]?.href).toBe('/contato');
    expect(groups[0]?.empty).toBe(true);
  });

  it('keeps going to work with no index (fetch failed)', () => {
    expect(viewFor(undefined, 'blog')[0]?.options[0]?.href).toBe('/posts');
  });

  it('gives every option a unique id for aria-activedescendant', () => {
    const ids = viewFor(index, '').flatMap(group => group.options.map(option => option.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wraps the active option with the arrows', () => {
    expect(move(0, -1, 5)).toBe(4);
    expect(move(4, 1, 5)).toBe(0);
    expect(move(0, 1, 0)).toBe(-1);
  });

  describe('theme action (theme-modes, REQ-011)', () => {
    it('offers the theme it switches to, last in General, on T', () => {
      const onNoir = viewFor(index, '', { theme: 'noir' })[0]?.options.at(-1);
      expect(onNoir).toEqual({ id: 'opt-theme', label: 'Usar tema claro', action: 'toggle-theme', keys: ['T'] });
      const onPaper = viewFor(index, '', { theme: 'paper' })[0]?.options.at(-1);
      expect(onPaper?.label).toBe('Usar tema escuro');
    });

    it('leaves it out when the page does not know its theme (no boot, no button)', () => {
      const labels = (viewFor(index, '')[0]?.options ?? []).map(option => option.label);
      expect(labels).not.toContain('Usar tema claro');
    });

    it('finds it by typing', () => {
      expect(viewFor(index, 'tema', { theme: 'noir' })[0]?.options[0]?.id).toBe('opt-theme');
    });
  });
});
