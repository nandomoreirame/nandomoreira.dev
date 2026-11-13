import { createHash, randomBytes } from 'node:crypto';
import { getFirestoreClient } from '../hire/firestore';
import type { Locale } from '../i18n/locale';
import type { ConfirmClaim, ConfirmStore } from './confirm';

export const NEWSLETTER_COLLECTION = 'newsletter_subscribers';

const CONFIRM_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

const normalise = (email: string): string => email.trim().toLowerCase();

/** Same email, same document: subscribing twice never duplicates (REQ-010). */
export const subscriberId = (email: string): string => createHash('sha256').update(normalise(email)).digest('hex');

/** Documents written before double opt-in have no status and stay on the list (REQ-009). */
export const statusOf = (doc: { status?: unknown; [key: string]: unknown }): 'pending' | 'confirmed' =>
  doc.status === 'pending' ? 'pending' : 'confirmed';

/** Only the document holding this exact, unexpired, pending token can be confirmed. */
export const canConfirm = (doc: Record<string, unknown>, tokenHash: string, now: Date): boolean =>
  statusOf(doc) === 'pending' &&
  doc.confirmTokenHash === tokenHash &&
  String(doc.confirmExpiresAt) >= now.toISOString();

/** Optional locale on the pending document; absent means pt-BR. */
export const localeOfDoc = (doc: Record<string, unknown> | null | undefined): Locale =>
  doc?.locale === 'en' ? 'en' : 'pt-BR';

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
 * Locale is optional and omitted for pt-BR (a language code, not visitor PII).
 */
export const toSubscriber = (email: string, now: Date, confirmation = newConfirmation(now), locale?: Locale) => ({
  email: normalise(email),
  status: 'pending' as const,
  subscribedAt: now.toISOString(),
  source: 'posts' as const,
  confirmTokenHash: confirmation.tokenHash,
  confirmExpiresAt: confirmation.expiresAt,
  ...(locale === 'en' ? { locale: 'en' as const } : {}),
});

/** `token` is the plaintext confirmation secret, present only when the address was just created. */
export interface SubscriptionSave {
  isNew: boolean;
  token: string | null;
}

export interface SubscriberStore {
  /** Whether the address is new, plus the confirmation token when it is. */
  save: (email: string, now: Date, locale?: Locale) => Promise<SubscriptionSave>;
  /** The stored document, when the address is already on the list. */
  lookup?: (email: string) => Promise<Record<string, unknown> | null>;
  /** Replaces the confirmation token of a pending address and returns the plaintext token. */
  reissue?: (email: string, now: Date) => Promise<string>;
}

/** gRPC ALREADY_EXISTS: the address is on the list already, which is a success. */
const ALREADY_EXISTS = 6;

export const firestoreSubscriberStore = (): SubscriberStore => ({
  save: async (email, now, locale) => {
    const confirmation = newConfirmation(now);
    try {
      await getFirestoreClient()
        .collection(NEWSLETTER_COLLECTION)
        .doc(subscriberId(email))
        .create({ ...toSubscriber(email, now, confirmation, locale), confirmSentAt: now.toISOString() });
      return { isNew: true, token: confirmation.token };
    } catch (error) {
      if ((error as { code?: number }).code === ALREADY_EXISTS) return { isNew: false, token: null };
      throw error;
    }
  },
  lookup: async email => {
    const snap = await getFirestoreClient().collection(NEWSLETTER_COLLECTION).doc(subscriberId(email)).get();
    return snap.exists ? (snap.data() ?? null) : null;
  },
  reissue: async (email, now) => {
    const confirmation = newConfirmation(now);
    await getFirestoreClient().collection(NEWSLETTER_COLLECTION).doc(subscriberId(email)).update({
      confirmTokenHash: confirmation.tokenHash,
      confirmExpiresAt: confirmation.expiresAt,
      confirmSentAt: now.toISOString(),
    });
    return confirmation.token;
  },
});

/**
 * Finds the document by its token hash, then re-checks canConfirm inside a transaction
 * before it writes, so two clicks on the same link cannot both confirm.
 */
export const firestoreConfirmStore = (): ConfirmStore => ({
  claim: async (tokenHash, now) => {
    const db = getFirestoreClient();
    const found = await db.collection(NEWSLETTER_COLLECTION).where('confirmTokenHash', '==', tokenHash).limit(1).get();
    const ref = found.docs[0]?.ref;
    if (!ref) return null;
    return db.runTransaction(async transaction => {
      const doc = (await transaction.get(ref)).data();
      if (!doc || !canConfirm(doc, tokenHash, now)) return null;
      transaction.update(ref, {
        status: 'confirmed',
        confirmedAt: now.toISOString(),
        confirmTokenHash: null,
        confirmSentAt: null,
      });
      if (typeof doc.email !== 'string') return null;
      return { email: doc.email, locale: localeOfDoc(doc) } satisfies ConfirmClaim;
    });
  },
  localeOf: async tokenHash => {
    const found = await getFirestoreClient()
      .collection(NEWSLETTER_COLLECTION)
      .where('confirmTokenHash', '==', tokenHash)
      .limit(1)
      .get();
    return localeOfDoc(found.docs[0]?.data());
  },
});
