import { describe, expect, it, vi } from 'vitest';
import { confirmedBy, handleSubscribe } from '../../src/lib/newsletter/handler';

describe('double opt-in', () => {
  it('novo endereço não notifica antes da confirmação', async () => {
    const notify = vi.fn();
    const thankYou = vi.fn();
    const sendConfirmation = vi.fn();
    const response = await handleSubscribe(formRequest('ana@example.com'), {
      store: { save: async () => ({ isNew: true, token: 'plain-token' }) },
      limiter: { check: () => true },
      now: () => new Date('2026-11-03T12:00:00Z'),
      notify,
      thankYou,
      sendConfirmation,
    });
    expect(response.status).toBe(303);
    expect(notify).not.toHaveBeenCalled();
    expect(thankYou).not.toHaveBeenCalled();
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
    expect(sendConfirmation).toHaveBeenCalledWith('ana@example.com', 'plain-token', 'pt-BR');
  });

  it('confirmação dispara aviso e boas-vindas uma vez', async () => {
    const notify = vi.fn();
    const thankYou = vi.fn();
    await confirmedBy({ email: 'ana@example.com', notify, thankYou });
    await confirmedBy({ email: 'ana@example.com', notify, thankYou });
    expect(notify).toHaveBeenCalledTimes(1);
    expect(thankYou).toHaveBeenCalledTimes(1);
  });
});

const formRequest = (email: string) =>
  new Request('https://nandomoreira.dev/api/subscribe?origem=/posts', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `email=${encodeURIComponent(email)}`,
  });
