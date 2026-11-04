import { createHash } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';

export interface HourlyStore {
  increment: (key: string, expiresAt: Date) => Promise<number>;
}

export const hourlyKeyOf = (ip: string, now: Date): string => {
  const hash = createHash('sha256').update(ip).digest('hex');
  return `${hash}-${now.toISOString().slice(0, 13)}`;
};

export const allowHourly = async (
  ip: string,
  now: Date,
  { store, max }: { store: HourlyStore; max: number },
): Promise<boolean> => {
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const count = await store.increment(hourlyKeyOf(ip, now), expiresAt);
  return count <= max;
};

export const HOURLY_COLLECTION = 'request_hourly_limits';

/** One counter per hashed IP and hour, deleted by Firestore TTL on `expiresAt`. */
export const firestoreHourlyStore = (): HourlyStore => ({
  increment: async (key, expiresAt) => {
    const db = getFirestoreClient();
    const ref = db.collection(HOURLY_COLLECTION).doc(key);
    return db.runTransaction(async transaction => {
      const snap = await transaction.get(ref);
      const count = (snap.exists ? Number(snap.get('count') ?? 0) : 0) + 1;
      transaction.set(ref, { count, expiresAt });
      return count;
    });
  },
});
