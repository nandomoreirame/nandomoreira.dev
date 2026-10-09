import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Dependencies, handleHire } from '../../src/lib/hire/handler';
import { FORM_HONEYPOT, formToPayload } from '../../src/lib/hire/form';
import type { StoredBriefing } from '../../src/lib/hire/store';

const saved: StoredBriefing[] = [];
let save: ReturnType<typeof vi.fn>;

const deps = (overrides: Partial<Dependencies> = {}): Dependencies => ({
  store: { save, markNotified: vi.fn(async () => undefined) },
  notifier: { send: vi.fn(async () => undefined) },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-10-08T12:00:00.000Z'),
  ...overrides,
});

const form = (fields: Array<[string, string]>) => new URLSearchParams(fields).toString();

const submit = (body: string, overrides: Partial<Dependencies> = {}) =>
  handleHire(
    new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    }),
    deps(overrides),
  );

const complete: Array<[string, string]> = [
  ['nome', 'Ada Lovelace'],
  ['email', 'ada@example.com'],
  ['empresa', 'Analytical Engines'],
  ['orcamento', '30k-60k'],
  ['interesse', 'job'],
  ['interesse', 'aeo'],
  ['mensagem', 'Quero um site preparado para agents.'],
];

beforeEach(() => {
  saved.length = 0;
  save = vi.fn(async (briefing: StoredBriefing) => {
    saved.push(briefing);
    return 'doc-1';
  });
});

describe('formToPayload', () => {
  it('maps the pt-BR form fields onto the English API payload', () => {
    expect(formToPayload(new URLSearchParams(complete))).toEqual({
      from: 'Ada Lovelace',
      contact: 'ada@example.com',
      company: 'Analytical Engines',
      budget: '30k-60k',
      interests: ['job', 'aeo'],
      brief: 'Quero um site preparado para agents.',
    });
  });

  it('drops optional fields left blank instead of storing empty strings', () => {
    const payload = formToPayload(
      new URLSearchParams([
        ['nome', 'Ada'],
        ['email', 'ada@example.com'],
        ['empresa', ''],
        ['orcamento', ''],
        ['mensagem', 'Oi'],
      ]),
    );
    expect(payload).toEqual({ from: 'Ada', contact: 'ada@example.com', brief: 'Oi' });
  });

  it('passes the honeypot and unknown keys through, so the schema still decides', () => {
    const payload = formToPayload(new URLSearchParams([...complete, ['website', 'x'], ['extra', 'y']]));
    expect(payload).toMatchObject({ website: 'x', extra: 'y' });
  });
});

describe('a form submission', () => {
  it('stores the briefing and redirects back to /contato with success', async () => {
    const response = await submit(form(complete));

    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(saved[0]).toMatchObject({ from: 'Ada Lovelace', budget: '30k-60k', interests: ['job', 'aeo'] });
  });

  it('redirects with "invalido" when a required field is missing', async () => {
    const response = await submit(form([['nome', 'Ada']]));
    expect(response.headers.get('location')).toBe('/contato?envio=invalido#envio');
    expect(save).not.toHaveBeenCalled();
  });

  it('redirects with "limite" when rate limited', async () => {
    const response = await submit(form(complete), { limiter: { check: () => false, size: () => 0 } });
    expect(response.headers.get('location')).toBe('/contato?envio=limite#envio');
  });

  it('redirects with "erro" when the briefing cannot be stored', async () => {
    save.mockRejectedValueOnce(new Error('down'));
    const response = await submit(form(complete));
    expect(response.headers.get('location')).toBe('/contato?envio=erro#envio');
  });

  it('maps the form honeypot onto the API honeypot', () => {
    expect(formToPayload(new URLSearchParams([[FORM_HONEYPOT, 'x']]))).toEqual({ website: 'x' });
  });

  it('logs a honeypot hit without its content, so a dropped message is visible', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await submit(form([...complete, [FORM_HONEYPOT, 'http://spam']]));
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0])).toMatch(/honeypot/);
    expect(String(warn.mock.calls[0])).not.toMatch(/spam|Ada|example\.com/);
    warn.mockRestore();
  });

  it('answers a filled honeypot exactly like a success, storing nothing', async () => {
    const response = await submit(form([...complete, [FORM_HONEYPOT, 'http://spam']]));
    expect(response.headers.get('location')).toBe('/contato?envio=ok#envio');
    expect(save).not.toHaveBeenCalled();
  });
});
