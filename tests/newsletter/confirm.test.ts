import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { confirmSubscription } from '../../src/lib/newsletter/confirm';
import { canConfirm, newConfirmation } from '../../src/lib/newsletter/store';

const memory = (doc: Record<string, unknown>) => ({
  claim: async (tokenHash: string, now: Date) => {
    if (!canConfirm(doc, tokenHash, now)) return null;
    Object.assign(doc, { status: 'confirmed', confirmTokenHash: null });
    return String(doc.email);
  },
});

const pendingDoc = (now: Date) => {
  const c = newConfirmation(now);
  const doc: Record<string, unknown> = {
    email: 'ana@example.com',
    status: 'pending',
    confirmTokenHash: c.tokenHash,
    confirmExpiresAt: c.expiresAt,
  };
  return { c, doc };
};

describe('confirmação', () => {
  it('confirma token válido uma única vez', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const { c, doc } = pendingDoc(now);
    const first = await confirmSubscription(c.token, now, memory(doc));
    const second = await confirmSubscription(c.token, now, memory(doc));
    expect(first).toBe('ana@example.com');
    expect(second).toBeNull();
    expect(doc.status).toBe('confirmed');
  });

  it('token inválido responde igual a inexistente', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const { doc } = pendingDoc(now);
    const wrong = await confirmSubscription('qualquer', now, memory(doc));
    const missing = await confirmSubscription('outro', now, { claim: async () => null });
    expect(wrong).toBe(missing);
    expect(doc.status).toBe('pending');
  });

  it('token expirado não confirma', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const { c, doc } = pendingDoc(now);
    const later = new Date('2026-11-11T12:00:00Z');
    expect(await confirmSubscription(c.token, later, memory(doc))).toBeNull();
    expect(doc.status).toBe('pending');
  });

  it('token antigo não confirma depois de reenviado', async () => {
    const now = new Date('2026-11-03T12:00:00Z');
    const { c, doc } = pendingDoc(now);
    doc.confirmTokenHash = createHash('sha256').update('novo').digest('hex');
    expect(await confirmSubscription(c.token, now, memory(doc))).toBeNull();
  });
});
