import { createHash, randomBytes } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';

export const NEWSLETTER_COLLECTION = 'newsletter_subscribers';

const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const normalise = (email: string): string => email.trim().toLowerCase();

/** Same email, same document: subscribing twice never duplicates (REQ-010). */
export const subscriberId = (email: string): string => createHash('sha256').update(normalise(email)).digest('hex');

/** Plaintext token stays in the confirmation mail. Only its hash is stored. */
export const newConfirmation = (now: Date) => {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: new Date(now.getTime() + CONFIRM_WINDOW_MS).toISOString(),
  };
};

/**
 * No IP and no user agent: the limiter uses the IP in memory and forgets it.
 * A new address stays pending until the confirmation link is opened (REQ-001).
 */
export const toSubscriber = (email: string, now: Date) => {
  const confirmation = newConfirmation(now);
  return {
    email: normalise(email),
    status: 'pending' as const,
    subscribedAt: now.toISOString(),
    source: 'posts' as const,
    confirmTokenHash: confirmation.tokenHash,
    confirmExpiresAt: confirmation.expiresAt,
  };
};

export interface SubscriberStore {
  /** True when the address is new; false when it was on the list already. */
  save: (email: string, now: Date) => Promise<boolean>;
}

/** gRPC ALREADY_EXISTS: the address is on the list already, which is a success. */
const ALREADY_EXISTS = 6;

export const firestoreSubscriberStore = (): SubscriberStore => ({
  save: async (email, now) => {
    try {
      await getFirestoreClient()
        .collection(NEWSLETTER_COLLECTION)
        .doc(subscriberId(email))
        .create(toSubscriber(email, now));
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === ALREADY_EXISTS) return false;
      throw error;
    }
  },
});
