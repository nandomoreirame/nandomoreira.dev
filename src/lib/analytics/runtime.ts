import { readAnalyticsConfig } from './config';
import { createRecorder } from './recorder';
import { firestoreAnalyticsStore } from './store';

/** One recorder per process, shared by middleware and routes. */
export const analyticsConfig = readAnalyticsConfig(process.env);

export const recorder = createRecorder({
  store: firestoreAnalyticsStore(),
  config: analyticsConfig,
  now: () => new Date(),
});
