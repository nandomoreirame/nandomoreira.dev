import { describe, expect, it } from 'vitest';
import { buildEvent } from '../../src/lib/analytics/event';
import { renderJourney } from '../../src/lib/analytics/journey';

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

describe('renderJourney', () => {
  it('says so when there is nothing', () => {
    expect(renderJourney([])).toContain('No journey recorded today.');
  });

  it('lists entry channel, UTM, country and pages in order, in São Paulo time', () => {
    const text = renderJourney([
      view('2026-10-14T17:09:00Z', '/contato', 'https://nandomoreira.dev/lab/forja'),
      view('2026-10-14T17:02:00Z', '/sessoes-do-red-dead', 'https://www.linkedin.com/', 'utm'),
      view('2026-10-14T17:05:00Z', '/lab/forja', 'https://nandomoreira.dev/sessoes-do-red-dead'),
    ]);

    expect(text).toContain('Entry:   utm:linkedin');
    expect(text).toContain('UTM:     linkedin / social / rdo');
    expect(text).toContain('Country: BR');
    expect(text).toContain('Visits:  3');
    expect(text.indexOf('14:02  /sessoes-do-red-dead')).toBeLessThan(text.indexOf('14:05  /lab/forja'));
    expect(text.indexOf('14:05  /lab/forja')).toBeLessThan(text.indexOf('14:09  /contato'));
  });

  it('ignores conversions and machine hits in the page list', () => {
    const conversion = { ...view('2026-10-14T17:10:00Z', '/api/hire', null), kind: 'conversion' as const };
    expect(renderJourney([conversion])).toContain('No journey recorded today.');
  });

  it('skips a stored event without a usable time instead of throwing', () => {
    const broken = { kind: 'pageview', path: '/x', channel: 'direct', utm: null, country: null } as never;
    expect(() => renderJourney([broken])).not.toThrow();
    expect(renderJourney([broken])).toContain('No journey recorded today.');
  });
});
