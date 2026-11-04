import { createHash, randomBytes } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';
import type { ConfirmStore } from './confirm';

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
export const toSubscriber = (email: string, now: Date, confirmation = newConfirmation(now)) => ({
  email: normalise(email),
  status: 'pending' as const,
  subscribedAt: now.toISOString(),
  source: 'posts' as const,
  confirmTokenHash: confirmation.tokenHash,
  confirmExpiresAt: confirmation.expiresAt,
});

/** `token` is the plaintext confirmation secret, present only when the address was just created. */
export interface SubscriptionSave {
  isNew: boolean;
  token: string | null;
}

export interface SubscriberStore {
  /** Whether the address is new, plus the confirmation token when it is. */
  save: (email: string, now: Date) => Promise<SubscriptionSave>;
}

/** gRPC ALREADY_EXISTS: the address is on the list already, which is a success. */
const ALREADY_EXISTS = 6;

export const firestoreSubscriberStore = (): SubscriberStore => ({
  save: async (email, now) => {
    const confirmation = newConfirmation(now);
    try {
      await getFirestoreClient()
        .collection(NEWSLETTER_COLLECTION)
        .doc(subscriberId(email))
        .create(toSubscriber(email, now, confirmation));
      return { isNew: true, token: confirmation.token };
    } catch (error) {
      if ((error as { code?: number }).code === ALREADY_EXISTS) return { isNew: false, token: null };
      throw error;
    }
  },
});

/** Finds a pending document by the hash of its confirmation token and patches that same document. */
export const firestoreConfirmStore = (): ConfirmStore => {
  let ref: { update: (patch: Record<string, unknown>) => Promise<unknown> } | null = null;
  return {
    find: async tokenHash => {
      const snap = await getFirestoreClient()
        .collection(NEWSLETTER_COLLECTION)
        .where('confirmTokenHash', '==', tokenHash)
        .limit(1)
        .get();
      const found = snap.docs[0];
      if (!found) {
        ref = null;
        return null;
      }
      ref = found.ref;
      return found.data();
    },
    update: async patch => {
      if (!ref) return;
      await ref.update(patch);
    },
  };
};
