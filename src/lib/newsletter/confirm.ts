import { createHash } from 'node:crypto';
import type { Locale } from '../i18n/locale';

export interface ConfirmClaim {
  email: string;
  locale: Locale;
}

export interface ConfirmStore {
  /**
   * Confirms the document when canConfirm holds at write time, in one atomic step.
   * Returns the email and locale only to the single call that performed the confirmation.
   */
  claim: (tokenHash: string, now: Date) => Promise<ConfirmClaim | null>;
  /** Locale of a pending token without consuming it. Unknown → pt-BR. */
  localeOf: (tokenHash: string) => Promise<Locale>;
}

export const confirmSubscription = (
  token: string,
  now: Date,
  store: ConfirmStore,
): Promise<ConfirmClaim | null> =>
  store.claim(createHash('sha256').update(token).digest('hex'), now);

export const localeOfToken = (token: string, store: ConfirmStore): Promise<Locale> =>
  store.localeOf(createHash('sha256').update(token).digest('hex'));
