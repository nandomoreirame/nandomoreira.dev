import { HIRE_COLLECTION, HIRE_NETWORK_COLLECTION, getFirestoreClient } from './firestore';
import type { HireRequest } from './schema';

export interface StoredBriefing {
  from: string;
  contact: string;
  brief: string;
  company: string | null;
  budget: string | null;
  interests: string[];
  /** What a sales-page visitor wants built; null from /contato and agents. */
  service: string | null;
  sourceIp: string;
  /** REQ-014: tells an agent apart from a script, when it declares itself. */
  userAgent: string | null;
  receivedAt: string;
  /** False until delivery is confirmed, never optimistically true (REQ-006). */
  notified: boolean;
  /** Firestore TTL deletes the briefing after this (privacy policy: 12 months). */
  expiresAt: Date;
  /** IP and user agent live apart and go sooner (privacy policy: 30 days). */
  networkExpiresAt: Date;
}

const BRIEFING_RETENTION_MONTHS = 12;
const NETWORK_RETENTION_DAYS = 30;

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
};

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * 86_400_000);

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
  company: payload.company ?? null,
  budget: payload.budget ?? null,
  interests: payload.interests ?? [],
  service: payload.service ?? null,
  sourceIp,
  userAgent: userAgent ? userAgent.slice(0, MAX_USER_AGENT) : null,
  receivedAt: now.toISOString(),
  notified: false,
  expiresAt: addMonths(now, BRIEFING_RETENTION_MONTHS),
  networkExpiresAt: addDays(now, NETWORK_RETENTION_DAYS),
});

/**
 * Firestore TTL removes whole documents, never single fields, so the data with
 * the shorter life goes into its own document under the same id.
 */
export const splitForStorage = ({
  sourceIp,
  userAgent,
  networkExpiresAt,
  ...document
}: StoredBriefing) => ({
  document,
  network: { sourceIp, userAgent, expiresAt: networkExpiresAt },
});

export const firestoreStore = (): BriefingStore => ({
  save: async (briefing) => {
    const db = getFirestoreClient();
    const { document, network } = splitForStorage(briefing);
    const reference = db.collection(HIRE_COLLECTION).doc();
    const batch = db.batch();
    batch.set(reference, document);
    batch.set(db.collection(HIRE_NETWORK_COLLECTION).doc(reference.id), network);
    await batch.commit();

    return reference.id;
  },
  markNotified: async (id) => {
    await getFirestoreClient().collection(HIRE_COLLECTION).doc(id).update({ notified: true });
  },
});
