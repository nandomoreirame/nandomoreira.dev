import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import { FORM_HONEYPOT } from '../../src/lib/hire/form';
import type { StoredBriefing } from '../../src/lib/hire/store';
import { salesFormToPayload, salesOriginOf } from '../../src/lib/sales/form';

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

const post = (
  query: string,
  fields: Array<[string, string]>,
  overrides: Partial<Dependencies> = {},
) =>
  handleHire(
    new Request(`https://nandomoreira.dev/api/hire${query}`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(fields).toString(),
    }),
    deps(overrides),
  );

const postJson = (body: Record<string, unknown>, overrides: Partial<Dependencies> = {}) =>
  handleHire(
    new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    deps(overrides),
  );

const lead: Array<[string, string]> = [
  ['nome', 'Ada'],
  ['contato', '11 91234-5678'],
  ['servico', 'website'],
  ['mensagem', ''],
  [FORM_HONEYPOT, ''],
];

beforeEach(() => {
  saved.length = 0;
});

describe('salesOriginOf', () => {
  it('maps the landing and each detail slug to its page', () => {
    expect(salesOriginOf(new URL('https://x/api/hire?origem=landing'))).toBe('/servicos');
    expect(salesOriginOf(new URL('https://x/api/hire?origem=site-institucional'))).toBe(
      '/servicos/site-institucional',
    );
  });

  it('ignores anything outside the closed list (no open redirect)', () => {
    for (const value of ['https://evil.example', '//evil.example', 'loja-virtual', '']) {
      expect(
        salesOriginOf(new URL(`https://x/api/hire?origem=${encodeURIComponent(value)}`)),
        value,
      ).toBeUndefined();
    }
    expect(salesOriginOf(new URL('https://x/api/hire'))).toBeUndefined();
  });
});

describe('salesFormToPayload', () => {
  it('maps contato and servico onto the API payload', () => {
    expect(
      salesFormToPayload(
        new URLSearchParams([...lead.slice(0, 3), ['mensagem', 'Tenho uma clínica.']]),
      ),
    ).toEqual({
      from: 'Ada',
      contact: '11 91234-5678',
      service: 'website',
      brief: 'Tenho uma clínica.',
    });
  });

  it('fills an empty message with the chosen service, since brief is required', () => {
    expect(salesFormToPayload(new URLSearchParams(lead)).brief).toBe(
      'Interesse: Site institucional',
    );
  });

  it('falls back to "not sure yet" when no service came either', () => {
    const params = new URLSearchParams([
      ['nome', 'Ada'],
      ['contato', 'ada@example.com'],
      ['mensagem', '  '],
    ]);
    expect(salesFormToPayload(params).brief).toBe('Interesse: Ainda não sei');
  });
});

describe('handleHire from a sales page', () => {
  it('stores the lead and goes back to the landing with ok', async () => {
    const response = await post('?origem=landing', lead);

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/servicos?envio=ok#envio');
    expect(saved[0]?.service).toBe('website');
  });

  it('returns to the detail page it came from', async () => {
    const response = await post('?origem=site-institucional', lead);
    expect(response.headers.get('location')).toBe(
      '/servicos/site-institucional?envio=ok#envio',
    );
  });

  it('redirects with limite on the landing when rate limited before the body is read', async () => {
    const response = await post('?origem=landing', lead, {
      limiter: { check: () => false, size: () => 0 },
    });
    expect(response.headers.get('location')).toBe('/servicos?envio=limite#envio');
  });

  it('redirects with limite on the detail page when rate limited', async () => {
    const response = await post('?origem=site-institucional', lead, {
      limiter: { check: () => false, size: () => 0 },
    });
    expect(response.headers.get('location')).toBe(
      '/servicos/site-institucional?envio=limite#envio',
    );
  });

  it('refuses a contact that is neither e-mail nor phone', async () => {
    const fields = lead.map(([key, value]): [string, string] => [
      key,
      key === 'contato' ? 'me chama' : value,
    ]);
    const response = await post('?origem=landing', fields);

    expect(response.headers.get('location')).toBe('/servicos?envio=invalido#envio');
    expect(saved).toHaveLength(0);
  });

  it('refuses an unreachable contact on the detail page too', async () => {
    const fields = lead.map(([key, value]): [string, string] => [
      key,
      key === 'contato' ? 'me chama' : value,
    ]);
    const response = await post('?origem=site-institucional', fields);

    expect(response.headers.get('location')).toBe(
      '/servicos/site-institucional?envio=invalido#envio',
    );
    expect(saved).toHaveLength(0);
  });

  it('sends an unknown origin with sales fields back to /contato without the contact rule', async () => {
    const response = await post('?origem=https%3A%2F%2Fevil.example', [
      ['nome', 'Ada'],
      ['contato', 'me chama'],
      ['servico', 'website'],
      ['mensagem', 'Oi'],
    ]);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(saved).toHaveLength(1);
    expect(saved[0]?.contact).toBe('me chama');
  });

  it('keeps free-text contact on /contato (sales contact rule is sales-only)', async () => {
    const response = await post('', [
      ['nome', 'Ada'],
      ['email', 'me chama'],
      ['mensagem', 'Oi'],
    ]);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(saved).toHaveLength(1);
    expect(saved[0]?.contact).toBe('me chama');
  });

  it('accepts free-text contact on a JSON POST (agents keep the free-text rule)', async () => {
    const response = await postJson({ from: 'Ada', contact: 'me chama', brief: 'Oi' });
    expect(response.status).toBe(202);
    expect(saved).toHaveLength(1);
    expect(saved[0]?.contact).toBe('me chama');
  });
});
