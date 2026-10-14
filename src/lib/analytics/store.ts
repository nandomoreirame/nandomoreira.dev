import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { getFirestoreClient } from '../hire/firestore';
import { type AnalyticsEvent, type Increment, dailyExpiry, dailyIncrements, keepsRawEvent } from './event';

export const EVENTS_COLLECTION = 'analytics_events';
export const DAILY_COLLECTION = 'analytics_daily';

export interface AnalyticsStore {
  record: (event: AnalyticsEvent) => Promise<void>;
  /** One visitor's events of one day, in no particular order. */
  eventsOf: (day: string, visitor: string) => Promise<AnalyticsEvent[]>;
}

/**
 * A merge `set` takes nested objects, not dotted paths: a dotted key would be
 * stored literally as a field name with dots in it.
 */
export const nestedIncrements = (
  paths: readonly Increment[],
  increment: (by: number) => unknown,
): Record<string, unknown> => {
  const root: Record<string, unknown> = {};

  for (const path of paths) {
    let node = root;
    for (const segment of path.slice(0, -1)) {
      node[segment] ??= {};
      node = node[segment] as Record<string, unknown>;
    }
    node[path.at(-1)!] = increment(1);
  }

  return root;
};

/**
 * One batch, two writes: the raw event (when kept) and the day's counters. The
 * daily document is written with merge, so the first visit of a day creates it
 * and every later one only increments (REQ-014).
 */
export const firestoreAnalyticsStore = (): AnalyticsStore => ({
  record: async (event) => {
    const db = getFirestoreClient();
    const batch = db.batch();

    if (keepsRawEvent(event)) batch.set(db.collection(EVENTS_COLLECTION).doc(), event);

    batch.set(
      db.collection(DAILY_COLLECTION).doc(event.day),
      {
        day: event.day,
        expiresAt: dailyExpiry(event.day),
        ...nestedIncrements(dailyIncrements(event), (by) => FieldValue.increment(by)),
      },
      { merge: true },
    );

    await batch.commit();
  },

  /**
   * Two equality filters and no orderBy: Firestore serves that from its
   * single-field indexes, so no composite index has to be deployed. The few
   * events of a visitor are sorted in memory by the caller.
   */
  eventsOf: async (day, visitor) => {
    const snapshot = await getFirestoreClient()
      .collection(EVENTS_COLLECTION)
      .where('day', '==', day)
      .where('visitor', '==', visitor)
      .limit(200)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() as Omit<AnalyticsEvent, 'expiresAt'> & { expiresAt: Timestamp };
      return { ...data, expiresAt: data.expiresAt.toDate() };
    });
  },
});
