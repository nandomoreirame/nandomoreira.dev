import { describe, expect, it } from 'vitest';
import { STATIC_ROUTES, staticCounterpart, routeFor } from '../../src/lib/i18n/routes';

describe('STATIC_ROUTES', () => {
  it('pairs every human page of the spec route map', () => {
    expect(STATIC_ROUTES).toEqual([
      { 'pt-BR': '/', en: '/en' },
      { 'pt-BR': '/portfolio', en: '/en/portfolio' },
      { 'pt-BR': '/lab', en: '/en/lab' },
      { 'pt-BR': '/posts', en: '/en/posts' },
      { 'pt-BR': '/sobre', en: '/en/about' },
      { 'pt-BR': '/contato', en: '/en/contact' },
      { 'pt-BR': '/curriculo', en: '/en/resume' },
      { 'pt-BR': '/mcp', en: '/en/mcp' },
      { 'pt-BR': '/setup', en: '/en/setup' },
      { 'pt-BR': '/now', en: '/en/now' },
      { 'pt-BR': '/privacidade', en: '/en/privacy' },
    ]);
  });

  it('has no duplicate path on either side', () => {
    const pt = STATIC_ROUTES.map(route => route['pt-BR']);
    const en = STATIC_ROUTES.map(route => route.en);
    expect(new Set(pt).size).toBe(pt.length);
    expect(new Set(en).size).toBe(en.length);
  });
});

describe('staticCounterpart', () => {
  it('maps both ways', () => {
    expect(staticCounterpart('/sobre')).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
    expect(staticCounterpart('/en/about')).toEqual({ 'pt-BR': '/sobre', en: '/en/about' });
  });

  it('has no pair for the archive (D12), the releases (D14) or unknown paths', () => {
    expect(staticCounterpart('/posts/arquivo')).toBeUndefined();
    expect(staticCounterpart('/posts/arquivo/2017')).toBeUndefined();
    expect(staticCounterpart('/releases')).toBeUndefined();
    expect(staticCounterpart('/releases/17')).toBeUndefined();
    expect(staticCounterpart('/en/nope')).toBeUndefined();
  });
});

describe('routeFor', () => {
  it('returns the localized path and throws on an unknown one', () => {
    expect(routeFor('/contato', 'en')).toBe('/en/contact');
    expect(routeFor('/contato', 'pt-BR')).toBe('/contato');
    expect(() => routeFor('/contatos', 'en')).toThrow(/No static route/);
  });
});
