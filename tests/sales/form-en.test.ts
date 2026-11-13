import { describe, expect, it } from 'vitest';
import { salesFormOrigin, salesFormToPayload, salesOriginOf } from '../../src/lib/sales/form';
import { handleHire } from '../../src/lib/hire/handler';

const at = (origin: string) =>
  new URL(`https://contrate.nandomoreira.dev/api/hire?origem=${encodeURIComponent(origin)}`);
describe('English sales form', () => {
  it('returns to English pages while preserving the Portuguese defaults', () => {
    expect(salesOriginOf(at('landing-en'), true)).toBe('/en');
    expect(salesOriginOf(at('website'), true)).toBe('/en/website');
    expect(salesOriginOf(at('landing'), true)).toBe('/');
    expect(salesOriginOf(at('site-institucional'), true)).toBe('/site-institucional');
    expect(salesOriginOf(at('landing-en'), false)).toBeUndefined();
    expect(salesOriginOf(at('website'), false)).toBeUndefined();
  });
  it.each(['https://evil.example', '/en', '__proto__', 'constructor', 'nope'])('rejects unknown origin %s', origin => {
    expect(salesOriginOf(at(origin), true)).toBeUndefined();
  });
  it('disambiguates coinciding service slugs without enabling unpublished details', () => {
    expect(salesFormOrigin('landing-page', 'en')).toBe('landing-page-en');
    expect(salesFormOrigin('blog', 'en')).toBe('blog-en');
    expect(salesFormOrigin('website', 'en')).toBe('website');
    expect(salesOriginOf(at('landing-page-en'), true)).toBeUndefined();
    expect(salesOriginOf(at('blog-en'), true)).toBeUndefined();
  });
  it('keeps the automatic briefing in Portuguese', () => {
    const payload = salesFormToPayload(
      new URLSearchParams({ nome: 'Ada', contato: 'ada@example.org', servico: 'website' }),
    );
    expect(payload.brief).toBe('Interesse: Site institucional');
  });
  it('redirects validation failures to the English form using the real handler', async () => {
    const response = await handleHire(
      new Request(at('landing-en'), {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'nome=&contato=invalid',
      }),
      {
        store: {
          save: async () => {
            throw new Error('must not save invalid input');
          },
          markNotified: async () => undefined,
        },
        notifier: { send: async () => undefined },
        limiter: { check: () => true, size: () => 0 },
        now: () => new Date('2026-11-13T12:00:00Z'),
      },
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/en?envio=invalido#envio');
  });
});
