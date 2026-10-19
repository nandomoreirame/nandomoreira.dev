import { FieldValue, type Timestamp } from 'firebase-admin/firestore';
import { getFirestoreClient } from '../hire/firestore';
import { type AnalyticsEvent, type Increment, dailyExpiry, dailyIncrements, keepsRawEvent } from './event';

export const EVENTS_COLLECTION = 'analytics_events';
export const DAILY_COLLECTION = 'analytics_daily';

export interface AnalyticsStore {
  /** The events of one request, written together (one batch, one daily update). */
  record: (events: readonly AnalyticsEvent[]) => Promise<void>;
  /** One visitor's events of one day, in no particular order. */
  eventsOf: (day: string, visitor: string) => Promise<AnalyticsEvent[]>;
}

/**
 * A merge `set` takes nested objects, not dotted paths: a dotted key would be
 * stored literally as a field name with dots in it. A path repeated across the
 * events of one batch becomes a single increment by its count.
 */
export const nestedIncrements = (
  paths: readonly Increment[],
  increment: (by: number) => unknown,
): Record<string, unknown> => {
  const counts = new Map<string, { path: Increment; by: number }>();
  for (const path of paths) {
    const key = path.join('\u0000');
    const entry = counts.get(key);
    if (entry) entry.by += 1;
    else counts.set(key, { path, by: 1 });
  }

  const root: Record<string, unknown> = {};
  for (const { path, by } of counts.values()) {
    let node = root;
    for (const segment of path.slice(0, -1)) {
      node[segment] ??= {};
      node = node[segment] as Record<string, unknown>;
    }
    node[path.at(-1)!] = increment(by);
  }

  return root;
};

/**
 * One batch per request: the raw events (when kept) and one merge per day
 * touched, so the first visit of a day creates the daily document and every
 * later one only increments (REQ-014). An MCP request with 20 messages is one
 * commit, not 20 racing on the same document.
 */
export const firestoreAnalyticsStore = (): AnalyticsStore => ({
  record: async events => {
    if (events.length === 0) return;
    const db = getFirestoreClient();
    const batch = db.batch();

    for (const event of events) {
      if (keepsRawEvent(event)) batch.set(db.collection(EVENTS_COLLECTION).doc(), event);
    }

    for (const day of new Set(events.map(event => event.day))) {
      const ofDay = events.filter(event => event.day === day);
      batch.set(
        db.collection(DAILY_COLLECTION).doc(day),
        {
          day,
          expiresAt: dailyExpiry(day),
          ...nestedIncrements(ofDay.flatMap(dailyIncrements), by => FieldValue.increment(by)),
        },
        { merge: true },
      );
    }

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

    return snapshot.docs.map(doc => {
      const data = doc.data() as Omit<AnalyticsEvent, 'expiresAt'> & { expiresAt: Timestamp };
      return { ...data, expiresAt: data.expiresAt.toDate() };
    });
  },
});
