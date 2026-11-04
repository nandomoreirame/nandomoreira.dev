import { describe, expect, it, vi } from 'vitest';
import { handleSubscribe, mayResendConfirmation } from '../../src/lib/newsletter/handler';

describe('reenvio', () => {
  it('pending reenvia confirmação só após 24 horas', () => {
    const sent = new Date('2026-11-03T12:00:00Z');
    expect(mayResendConfirmation(sent, new Date('2026-11-03T20:00:00Z'))).toBe(false);
    expect(mayResendConfirmation(sent, new Date('2026-11-04T12:00:00Z'))).toBe(true);
  });

  it('confirmed não reenvia nada', () => {
    expect(mayResendConfirmation(null, new Date())).toBe(false);
  });

  it('pending no handler reenvia só depois da janela', async () => {
    const sendConfirmation = vi.fn();
    const reissue = vi.fn(async () => 'novo-token');
    const pending = (confirmSentAt: string) => ({
      store: {
        save: async () => ({ isNew: false, token: null }),
        lookup: async () => ({ status: 'pending', confirmSentAt }),
        reissue,
      },
      limiter: { check: () => true },
      now: () => new Date('2026-11-04T12:00:00Z'),
      sendConfirmation,
    });
    const request = () =>
      new Request('https://nandomoreira.dev/api/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: 'email=ana%40example.com',
      });

    await handleSubscribe(request(), pending('2026-11-04T08:00:00.000Z'));
    expect(sendConfirmation).not.toHaveBeenCalled();

    await handleSubscribe(request(), pending('2026-11-03T12:00:00.000Z'));
    expect(sendConfirmation).toHaveBeenCalledTimes(1);
    expect(sendConfirmation).toHaveBeenCalledWith('ana@example.com', 'novo-token');

    sendConfirmation.mockClear();
    await handleSubscribe(request(), {
      ...pending('2026-11-03T12:00:00.000Z'),
      store: {
        save: async () => ({ isNew: false, token: null }),
        lookup: async () => ({ status: 'confirmed', confirmSentAt: null }),
        reissue,
      },
    });
    expect(sendConfirmation).not.toHaveBeenCalled();
  });
});
