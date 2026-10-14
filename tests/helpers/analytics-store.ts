import { type AnalyticsEvent, dailyIncrements, keepsRawEvent } from '../../src/lib/analytics/event';
import type { AnalyticsStore } from '../../src/lib/analytics/store';

/** Same rules as the Firestore store, kept in memory. Counters keyed by dotted path. */
export const memoryAnalyticsStore = () => {
  const events: AnalyticsEvent[] = [];
  const daily = new Map<string, Record<string, number>>();

  const store: AnalyticsStore = {
    record: async (batch) => {
      for (const event of batch) {
        if (keepsRawEvent(event)) events.push(event);
        const counters = daily.get(event.day) ?? {};
        for (const path of dailyIncrements(event)) {
          const key = path.join('.');
          counters[key] = (counters[key] ?? 0) + 1;
        }
        daily.set(event.day, counters);
      }
    },
    eventsOf: async (day, visitor) => events.filter((event) => event.day === day && event.visitor === visitor),
  };

  return { store, events, daily };
};
