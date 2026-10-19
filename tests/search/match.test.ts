import { describe, expect, it } from 'vitest';
import { normalize, scoreOf, type Searchable } from '../../src/lib/search/match';

const item: Searchable = {
  title: 'Meu homelab num Mac mini',
  summary: 'Discos, DNS e Tailscale',
  keywords: ['linux', 'redes'],
};

describe('search matching', () => {
  it('ignores case and accents', () => {
    expect(normalize('Ação Rápida')).toBe('acao rapida');
  });

  it('requires every typed term', () => {
    expect(scoreOf(item, 'homelab dns')).toBeGreaterThan(0);
    expect(scoreOf(item, 'homelab kubernetes')).toBe(0);
  });

  it('ranks a title hit above a keyword hit above a summary hit', () => {
    expect(scoreOf(item, 'homelab')).toBeGreaterThan(scoreOf(item, 'redes'));
    expect(scoreOf(item, 'redes')).toBeGreaterThan(scoreOf(item, 'tailscale'));
  });

  it('matches everything on an empty query, with no score', () => {
    expect(scoreOf(item, '   ')).toBe(0);
  });
});
