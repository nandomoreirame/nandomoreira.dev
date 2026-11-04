import { describe, expect, it, vi } from 'vitest';
import { handleSubscribe } from '../../src/lib/newsletter/handler';

describe('portão de captcha', () => {
  it('form sem captcha responde captcha e não grava', async () => {
    const save = vi.fn(async () => ({ isNew: true, token: 't' }));
    const request = new Request('https://nandomoreira.dev/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'email=ana%40example.com',
    });
    const response = await handleSubscribe(request, {
      store: { save, lookup: async () => null },
      limiter: { check: () => true },
      now: () => new Date(),
      captcha: { required: true, verify: async () => false },
      sendConfirmation: vi.fn(),
    });
    expect(response.headers.get('location')).toContain('assinatura=captcha');
    expect(save).not.toHaveBeenCalled();
  });

  it('Origin fora da allowlist responde erro sem ler a gravação', async () => {
    const save = vi.fn(async () => ({ isNew: true, token: 't' }));
    const request = new Request('https://nandomoreira.dev/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', origin: 'https://evil.example' },
      body: 'email=ana%40example.com',
    });
    const response = await handleSubscribe(request, {
      store: { save },
      limiter: { check: () => true },
      now: () => new Date(),
      origins: ['https://nandomoreira.dev'],
      sendConfirmation: vi.fn(),
    });
    expect(response.headers.get('location')).toContain('assinatura=erro');
    expect(save).not.toHaveBeenCalled();
  });

  it('a 11ª hora bloqueada responde limite e não grava', async () => {
    const save = vi.fn(async () => ({ isNew: true, token: 't' }));
    const request = new Request('https://nandomoreira.dev/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.7' },
      body: 'email=ana%40example.com',
    });
    const response = await handleSubscribe(request, {
      store: { save },
      limiter: { check: () => true },
      now: () => new Date('2026-11-03T12:10:00Z'),
      hourly: { allow: async () => false },
      sendConfirmation: vi.fn(),
    });
    expect(response.headers.get('location')).toContain('assinatura=limite');
    expect(save).not.toHaveBeenCalled();
  });
});
