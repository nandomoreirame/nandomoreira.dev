import { createHash } from 'node:crypto';

export interface ConfirmStore {
  /**
   * Confirms the document when canConfirm holds at write time, in one atomic step.
   * Returns the email only to the single call that performed the confirmation.
   */
  claim: (tokenHash: string, now: Date) => Promise<string | null>;
}

export const confirmSubscription = (token: string, now: Date, store: ConfirmStore): Promise<string | null> =>
  store.claim(createHash('sha256').update(token).digest('hex'), now);
