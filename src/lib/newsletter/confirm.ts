import { createHash } from 'node:crypto';

export type ConfirmOutcome = 'confirmed' | 'invalid';

export interface ConfirmStore {
  find: (tokenHash: string) => Promise<Record<string, unknown> | null>;
  update: (patch: Record<string, unknown>) => Promise<void>;
}

export const confirmSubscription = async (
  token: string,
  now: Date,
  store: ConfirmStore,
): Promise<ConfirmOutcome> => {
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const doc = await store.find(tokenHash);
  if (!doc || doc.status !== 'pending') return 'invalid';
  if (String(doc.confirmExpiresAt) < now.toISOString()) return 'invalid';
  await store.update({
    status: 'confirmed',
    confirmedAt: now.toISOString(),
    confirmTokenHash: null,
    confirmSentAt: null,
  });
  return 'confirmed';
};
