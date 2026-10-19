import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import type { StoredBriefing } from '../../src/lib/hire/store';
import { salesVisitOf } from '../../src/lib/sales/form';

const saved: StoredBriefing[] = [];

const deps = (overrides: Partial<Dependencies> = {}): Dependencies => ({
  store: {
    save: vi.fn(async (briefing: StoredBriefing) => {
      saved.push(briefing);
      return 'doc-1';
    }),
    markNotified: vi.fn(async () => undefined),
  },
  notifier: { send: vi.fn(async () => undefined) },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-18T12:00:00.000Z'),
  ...overrides,
});

const post = (query: string, fields: Array<[string, string]>, overrides: Partial<Dependencies> = {}) =>
  handleHire(
    new Request(`https://nandomoreira.dev/api/hire${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(overrides),
  );

const lead: Array<[string, string]> = [
  ['nome', 'Ada'],
  ['email', 'ada@exemplo.com'],
  ['servico', 'website'],
  ['interesse', 'freelance'],
  ['mensagem', 'Preciso de um site para a minha clínica.'],
  [FORM_HONEYPOT, ''],
];

beforeEach(() => {
  saved.length = 0;
});

const visit = (query: string) => salesVisitOf(new URLSearchParams(query));

describe('salesVisitOf', () => {
  it('reads a visit from the landing or a detail page', () => {
    expect(visit('origem=landing')).toEqual({ origin: 'landing', service: undefined });
    expect(visit('origem=site-institucional&servico=website')).toEqual({ origin: 'site-institucional', service: 'website' });
  });

  it('takes a known service even without an origin', () => {
    expect(visit('servico=landing-page')).toEqual({ origin: undefined, service: 'landing-page' });
  });

  it('ignores anything outside the closed lists', () => {
    expect(visit('')).toBeUndefined();
    expect(visit('origem=https://evil.example')).toBeUndefined();
    expect(visit('servico=toString')).toBeUndefined();
    expect(visit('origem=landing&servico=nada')).toEqual({ origin: 'landing', service: undefined });
  });
});

describe('handleHire with the one contact form', () => {
  it('stores the service the sales page passed along', async () => {
    const response = await post('', lead);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(saved[0]?.service).toBe('website');
  });

  it('no longer sends anyone back to a sales page, whatever ?origem says', async () => {
    for (const origem of ['landing', 'site-institucional']) {
      const response = await post(`?origem=${origem}`, lead);
      expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    }
    const limited = await post('?origem=landing', lead, { limiter: { check: () => false, size: () => 0 } });
    expect(limited.headers.get('location')).toBe('/contato?envio=limite#envio');
  });
});
