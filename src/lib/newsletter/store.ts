import { createHash } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';

export const NEWSLETTER_COLLECTION = 'newsletter_subscribers';

const normalise = (email: string): string => email.trim().toLowerCase();

/** Same email, same document: subscribing twice never duplicates (REQ-010). */
export const subscriberId = (email: string): string => createHash('sha256').update(normalise(email)).digest('hex');

/** No IP and no user agent: the limiter uses the IP in memory and forgets it. */
export const toSubscriber = (email: string, now: Date) => ({
  email: normalise(email),
  subscribedAt: now.toISOString(),
  source: 'posts' as const,
});

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
