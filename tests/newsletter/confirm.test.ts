import { describe, expect, it } from 'vitest';
import { confirmSubscription } from '../../src/lib/newsletter/confirm';
import { newConfirmation } from '../../src/lib/newsletter/store';

const memory = (doc: Record<string, unknown>) => ({
  find: async () => doc,
  update: async (patch: Record<string, unknown>) => Object.assign(doc, patch),
});

describe('confirmação', () => {
  it('confirma token válido uma única vez', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const c = newConfirmation(now);
    const doc: Record<string, unknown> = { status: 'pending', confirmTokenHash: c.tokenHash, confirmExpiresAt: c.expiresAt };
    const first = await confirmSubscription(c.token, now, memory(doc));
    const second = await confirmSubscription(c.token, now, memory(doc));
    expect(first).toBe('confirmed');
    expect(second).toBe('invalid');
    expect(doc.status).toBe('confirmed');
  });

  it('token inválido responde igual a inexistente', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const none = await confirmSubscription('qualquer', now, memory({}));
    const missing = await confirmSubscription('outro', now, { find: async () => null, update: async () => {} });
    expect(none).toBe(missing);
  });
});
