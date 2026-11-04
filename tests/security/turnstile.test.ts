import { describe, expect, it, vi } from 'vitest';
import { requiresCaptcha, verifyTurnstile } from '../../src/lib/security/turnstile';

const form = new Request('https://nandomoreira.dev/api/hire', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
});
const json = new Request('https://nandomoreira.dev/api/hire', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
});

describe('turnstile', () => {
  it('form sem token Turnstile é recusado', async () => {
    expect(requiresCaptcha(form)).toBe(true);
    expect(await verifyTurnstile('', { secret: 's', fetch: vi.fn(), remoteIp: '1.1.1.1' })).toBe(false);
  });

  it('JSON de agente dispensa Turnstile', () => {
    expect(requiresCaptcha(json)).toBe(false);
  });

  it('token rejeitado pela API é recusado', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile('tok', { secret: 's', fetch, remoteIp: '1.1.1.1' })).toBe(false);
  });

  it('token aceito pela API passa', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ success: true }), { status: 200 }));
    expect(await verifyTurnstile('tok', { secret: 's', fetch, remoteIp: '1.1.1.1' })).toBe(true);
  });
});
