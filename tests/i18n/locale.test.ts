import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  htmlLang,
  localeOfPath,
  ogLocale,
  stripLocale,
  withLocale,
} from '../../src/lib/i18n/locale';

describe('localeOfPath', () => {
  it.each([
    ['/en', 'en'],
    ['/en/', 'en'],
    ['/en/about', 'en'],
    ['/en/portfolio/forja', 'en'],
    ['/', 'pt-BR'],
    ['/sobre', 'pt-BR'],
    ['/english-post', 'pt-BR'],
    ['/enxame', 'pt-BR'],
    ['/posts/en', 'pt-BR'],
  ])('%s is %s', (path, locale) => {
    expect(localeOfPath(path)).toBe(locale);
  });
});

describe('stripLocale', () => {
  it('drops the /en prefix and keeps the root', () => {
    expect(stripLocale('/en')).toBe('/');
    expect(stripLocale('/en/about')).toBe('/about');
    expect(stripLocale('/sobre')).toBe('/sobre');
  });
});

describe('withLocale', () => {
  it('prefixes only English paths', () => {
    expect(withLocale('/', 'en')).toBe('/en');
    expect(withLocale('/about', 'en')).toBe('/en/about');
    expect(withLocale('/sobre', 'pt-BR')).toBe('/sobre');
  });

  it('never doubles the prefix', () => {
    expect(withLocale('/en/about', 'en')).toBe('/en/about');
  });
});

describe('constants', () => {
  it('pt-BR is the default and comes first', () => {
    expect(DEFAULT_LOCALE).toBe('pt-BR');
    expect(LOCALES).toEqual(['pt-BR', 'en']);
  });

  it('maps html lang and og:locale', () => {
    expect(htmlLang('pt-BR')).toBe('pt-BR');
    expect(htmlLang('en')).toBe('en');
    expect(ogLocale('pt-BR')).toBe('pt_BR');
    expect(ogLocale('en')).toBe('en_US');
  });
});
