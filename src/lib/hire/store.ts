import { HIRE_COLLECTION, getFirestoreClient } from './firestore';
import type { HireRequest } from './schema';

export interface StoredBriefing {
  from: string;
  contact: string;
  brief: string;
  sourceIp: string;
  /** REQ-014: tells an agent apart from a script, when it declares itself. */
  userAgent: string | null;
  receivedAt: string;
  /** False until delivery is confirmed, never optimistically true (REQ-006). */
  notified: boolean;
}

export interface StoreInput {
  payload: HireRequest;
  sourceIp: string;
  userAgent: string | null;
  now: Date;
}

/** Injectable so the tests exercise this logic without reaching a real database. */
export interface BriefingStore {
  save: (briefing: StoredBriefing) => Promise<string>;
  markNotified: (id: string) => Promise<void>;
}

/** Capped: a header is caller-controlled and this is personal data in a database. */
const MAX_USER_AGENT = 256;

export const toStoredBriefing = ({
  payload,
  sourceIp,
  userAgent,
  now,
}: StoreInput): StoredBriefing => ({
  from: payload.from,
  contact: payload.contact,
  brief: payload.brief,
  sourceIp,
  userAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT) : null,
  receivedAt: now.toISOString(),
  notified: false,
});

export const firestoreStore = (): BriefingStore => ({
  save: async (briefing) => {
    const reference = await getFirestoreClient().collection(HIRE_COLLECTION).add(briefing);

    return reference.id;
  },
  markNotified: async (id) => {
    await getFirestoreClient().collection(HIRE_COLLECTION).doc(id).update({ notified: true });
  },
});
