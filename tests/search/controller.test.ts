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
    expect(viewFor(index, '').map((group) => group.label)).toEqual(['Geral', 'Ir para']);
  });

  it('groups hits by kind, archive always last, best score first', () => {
    const groups = viewFor(index, 'homelab');
    expect(groups.map((group) => group.label)).toEqual(['Posts', 'Arquivo']);
  });

  it('sends "Enviar e-mail" to the contact page', () => {
    const general = viewFor(index, '')[0]?.options ?? [];
    expect(general.find((option) => option.label === 'Enviar e-mail')?.href).toBe('/contato');
  });

  it('offers the page markdown and AI view in General when the page has them', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', aiPath: '/sobre/ia' })[0]?.options ?? [];
    expect(general.map((option) => [option.label, option.href])).toEqual([
      ['Copiar link', undefined],
      ['Enviar e-mail', '/contato'],
      ['Versão .md', '/sobre.md'],
      ['Versão para IA', '/sobre/ia'],
    ]);
    expect(viewFor(index, 'md', { mdPath: '/sobre.md' })[0]?.options[0]?.href).toBe('/sobre.md');
  });

  it('offers the human version instead while on the AI view', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', humanPath: '/sobre' })[0]?.options ?? [];
    expect(general.map((option) => [option.label, option.href]).slice(2)).toEqual([
      ['Versão .md', '/sobre.md'],
      ['Versão para humanos', '/sobre'],
    ]);
  });

  it('shows each General action with its one-letter shortcut', () => {
    const general = viewFor(index, '', { mdPath: '/sobre.md', aiPath: '/sobre/ia' })[0]?.options ?? [];
    expect(general.map((option) => option.keys)).toEqual([['L'], ['E'], ['M'], ['I']]);
    const human = viewFor(index, '', { humanPath: '/sobre' })[0]?.options.at(-1);
    expect(human?.keys).toEqual(['I']);
  });

  it('leaves them out on a page without those views', () => {
    const labels = (viewFor(index, '')[0]?.options ?? []).map((option) => option.label);
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
    const ids = viewFor(index, '').flatMap((group) => group.options.map((option) => option.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('wraps the active option with the arrows', () => {
    expect(move(0, -1, 5)).toBe(4);
    expect(move(4, 1, 5)).toBe(0);
    expect(move(0, 1, 0)).toBe(-1);
  });
});
