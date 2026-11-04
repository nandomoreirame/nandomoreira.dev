import { describe, expect, it, vi } from 'vitest';
import { formToPayload } from '../../src/lib/hire/form';
import { handleHire } from '../../src/lib/hire/handler';

const form = (origin?: string) =>
  new Request('https://nandomoreira.dev/api/hire', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      'x-forwarded-for': '203.0.113.7',
      ...(origin ? { origin } : {}),
    },
    body: new URLSearchParams({
      nome: 'Ana',
      email: 'ana@example.com',
      mensagem: 'Quero conversar sobre um projeto de plataforma.',
      'cf-turnstile-response': 'tok',
    }).toString(),
  });

const deps = (overrides = {}) => ({
  store: { save: vi.fn(async () => 'doc-1'), markNotified: vi.fn() },
  notifier: { send: vi.fn() },
  limiter: { check: () => true, size: () => 0 },
  now: () => new Date('2026-11-03T12:00:00Z'),
  ...overrides,
});

describe('portão do formulário de contato', () => {
  it('form sem captcha válido não grava', async () => {
    const save = vi.fn(async () => 'doc-1');
    const response = await handleHire(form(), {
      ...deps(),
      store: { save, markNotified: vi.fn() },
      captcha: { required: true, verify: async () => false },
    });
    expect(response.headers.get('location')).toContain('envio=captcha');
    expect(save).not.toHaveBeenCalled();
  });

  it('JSON de agente não exige captcha', async () => {
    const save = vi.fn(async () => 'doc-1');
    const request = new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
      body: JSON.stringify({
        from: 'Agente',
        contact: 'a@b.co',
        brief: 'Precisamos de um cliente multi-CLI para a equipe.',
      }),
    });
    const response = await handleHire(request, {
      ...deps(),
      store: { save, markNotified: vi.fn() },
      captcha: { required: true, verify: async () => false },
    });
    expect(response.status).toBe(202);
    expect(save).toHaveBeenCalled();
  });

  it('JSON de agente não consome o limite por hora', async () => {
    const allow = vi.fn(async () => false);
    const request = new Request('https://nandomoreira.dev/api/hire', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
      body: JSON.stringify({
        from: 'Agente',
        contact: 'a@b.co',
        brief: 'Precisamos de um cliente multi-CLI para a equipe.',
      }),
    });
    const response = await handleHire(request, {
      ...deps(),
      hourly: { allow },
    });
    expect(response.status).toBe(202);
    expect(allow).not.toHaveBeenCalled();
  });

  it('form acima do limite por hora responde limite', async () => {
    const response = await handleHire(form(), {
      ...deps(),
      hourly: { allow: async () => false },
    });
    expect(response.headers.get('location')).toContain('envio=limite');
  });

  it('o token do widget não entra no payload estrito', () => {
    const payload = formToPayload(new URLSearchParams({ nome: 'Ana', 'cf-turnstile-response': 'tok' }));
    expect(payload).not.toHaveProperty('cf-turnstile-response');
  });
});
