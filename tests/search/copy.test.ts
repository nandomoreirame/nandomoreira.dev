import { describe, expect, it } from 'vitest';
import { GO_TARGETS, PALETTE_COPY, PALETTE_PAGES } from '../../src/lib/search/copy';

describe('palette copy', () => {
  it('maps G + letter to the site sections, one letter each', () => {
    expect(GO_TARGETS.map((target) => [target.key, target.path])).toEqual([
      ['h', '/'],
      ['b', '/posts'],
      ['p', '/portfolio'],
      ['l', '/lab'],
      ['s', '/sobre'],
      ['u', '/setup'],
      ['n', '/now'],
      ['c', '/contato'],
      ['m', '/mcp'],
    ]);
    expect(new Set(GO_TARGETS.map((target) => target.key)).size).toBe(GO_TARGETS.length);
  });

  it('writes every visible string in pt-BR, without dashes', () => {
    const text = JSON.stringify({ PALETTE_COPY, GO_TARGETS, PALETTE_PAGES });
    expect(text).not.toMatch(/[–—]/);
    expect(PALETTE_COPY.placeholder).toBe('Digite um comando ou busque…');
    expect(PALETTE_COPY.groups.go).toBe('Ir para');
  });

  it('lists the site pages for the index, including the CV', () => {
    expect(PALETTE_PAGES.map((page) => page.path)).toContain('/curriculo');
  });
});
