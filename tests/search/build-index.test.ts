import { describe, expect, it } from 'vitest';
import { buildSearchIndex } from '../../src/lib/search/build-index';

const post = (slug: string, draft = false) => ({
  slug,
  title: `Post ${slug}`,
  summary: 'Resumo',
  markers: ['a', 'b', 'c'],
  draft,
});

describe('buildSearchIndex', () => {
  const index = buildSearchIndex({
    current: [post('novo'), post('rascunho', true)],
    archived: [post('velho')],
    projects: [{ slug: 'forja', title: 'Forja', summary: 'Cliente desktop', tech: ['Electron'], block: 'systems-cli' }],
    services: [{ title: 'Landing page', summary: 'Uma página', url: 'https://contrate.nandomoreira.dev/landing-page' }],
    landingUrl: 'https://contrate.nandomoreira.dev/',
  });

  it('lists pages, current posts, archived posts, cases and services, without drafts', () => {
    const kinds = new Set(index.map(item => item.kind));
    expect([...kinds].sort()).toEqual(['archive', 'case', 'page', 'post', 'service']);
    expect(index.find(item => item.title === 'Post rascunho')).toBeUndefined();
  });

  it('points posts at /slug, cases at their collection and services at the sales host', () => {
    expect(index.find(item => item.title === 'Post novo')?.path).toBe('/novo');
    expect(index.find(item => item.title === 'Post velho')?.kind).toBe('archive');
    expect(index.find(item => item.title === 'Forja')?.path).toMatch(/^\/(portfolio|lab)\/forja$/);
    expect(index.find(item => item.title === 'Landing page')?.path).toBe(
      'https://contrate.nandomoreira.dev/landing-page',
    );
    expect(index.find(item => item.path === 'https://contrate.nandomoreira.dev/')?.kind).toBe('service');
  });

  it('keeps markers and tech as keywords', () => {
    expect(index.find(item => item.title === 'Forja')?.keywords).toEqual(['Electron']);
  });
});
