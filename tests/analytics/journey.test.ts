import { describe, expect, it } from 'vitest';
import { buildEvent } from '../../src/lib/analytics/event';
import { journeyOf } from '../../src/lib/analytics/journey';

const CHROME = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/129.0 Safari/537.36';
const view = (iso: string, path: string, referrer: string | null, search = '') =>
  buildEvent({
    kind: 'pageview',
    at: new Date(iso),
    day: '2026-10-14',
    visitor: 'v',
    userAgent: CHROME,
    source: 'ssr',
    path,
    referrer,
    utm: search ? { source: 'linkedin', medium: 'social', campaign: 'rdo' } : null,
    country: 'BR',
  });

describe('journeyOf', () => {
  it('returns an empty journey when there is nothing', () => {
    expect(journeyOf([])).toEqual({
      entry: 'direto',
      utm: 'nenhuma',
      country: 'desconhecido',
      views: [],
    });
  });

  it('lists entry channel, UTM, country and pages in order, in São Paulo time', () => {
    const journey = journeyOf([
      view('2026-10-14T17:09:00Z', '/contato', 'https://nandomoreira.dev/lab/forja'),
      view('2026-10-14T17:02:00Z', '/sessoes-do-red-dead', 'https://www.linkedin.com/', 'utm'),
      view('2026-10-14T17:05:00Z', '/lab/forja', 'https://nandomoreira.dev/sessoes-do-red-dead'),
    ]);

    expect(journey.entry).toBe('utm:linkedin');
    expect(journey.utm).toBe('linkedin / social / rdo');
    expect(journey.country).toBe('BR');
    expect(journey.views).toEqual([
      { time: '14:02', path: '/sessoes-do-red-dead' },
      { time: '14:05', path: '/lab/forja' },
      { time: '14:09', path: '/contato' },
    ]);
  });

  it('translates direct and internal channels, and unknown country, into pt-BR', () => {
    const direct = journeyOf([view('2026-10-14T17:02:00Z', '/', null)]);
    expect(direct.entry).toBe('direto');
    expect(direct.utm).toBe('nenhuma');

    const internal = buildEvent({
      kind: 'pageview',
      at: new Date('2026-10-14T17:02:00Z'),
      day: '2026-10-14',
      visitor: 'v',
      userAgent: CHROME,
      source: 'ssr',
      path: '/contato',
      referrer: 'https://nandomoreira.dev/',
      utm: null,
      country: null,
    });
    const journey = journeyOf([internal]);
    expect(journey.entry).toBe('interno');
    expect(journey.country).toBe('desconhecido');
  });

  it('ignores conversions and machine hits in the page list', () => {
    const conversion = { ...view('2026-10-14T17:10:00Z', '/api/hire', null), kind: 'conversion' as const };
    expect(journeyOf([conversion]).views).toEqual([]);
  });

  it('skips a stored event without a usable time instead of throwing', () => {
    const broken = { kind: 'pageview', path: '/x', channel: 'direct', utm: null, country: null } as never;
    expect(() => journeyOf([broken])).not.toThrow();
    expect(journeyOf([broken]).views).toEqual([]);
  });
});
