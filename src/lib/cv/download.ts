import { Resend } from 'resend';
import { z } from 'zod';
import type { HireConfig } from '../hire/config';
import { getFirestoreClient } from '../hire/firestore';
import { FORM_HONEYPOT } from '../hire/form';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { readLimitedText } from '../hire/read-body';

/** The file /sobre offers, served from public/. */
export const CV_PDF_PATH = '/curriculo-fernando-moreira.pdf';
export const CV_PAGE = '/curriculo';

/**
 * The name the browser saves the PDF under, stamped with the moment of the
 * download in São Paulo time: curriculo-fernando-moreira-senior-ai-engineer-
 * 202610111532.pdf. A recruiter with several versions in Downloads can tell
 * them apart, and the date says how fresh the copy is.
 */
export const cvFileName = (now: Date): string => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );

  return `curriculo-fernando-moreira-senior-ai-engineer-${parts.year}${parts.month}${parts.day}${parts.hour}${parts.minute}.pdf`;
};
export const CV_COLLECTION = 'cv_downloads';

/**
 * Only what the visitor typed, on purpose: the page asks "só para eu saber quem
 * está baixando", so the IP and the user agent the contact form keeps have no
 * use here. The rate limit reads the IP in memory and never writes it.
 * Both fields are optional; a record exists only when at least one was given.
 */
export interface CvDownload {
  name: string | null;
  email: string | null;
  receivedAt: string;
  /** False until delivery is confirmed, never optimistically true. */
  notified: boolean;
  /** Firestore TTL deletes the record after this (privacy policy: 12 months). */
  expiresAt: Date;
}

export interface CvStore {
  save: (download: CvDownload) => Promise<string>;
  markNotified: (id: string) => Promise<void>;
}

export interface CvNotifier {
  send: (download: CvDownload, id: string) => Promise<void>;
}

export interface CvDependencies {
  store: CvStore;
  notifier: CvNotifier;
  limiter: Limiter;
  now: () => Date;
}

const RETENTION_MONTHS = 12;

const emailSchema = z.email().max(254);
const MAX_NAME = 200;

/** Where the form lands; the page reads `envio`. */
type Outcome = 'ok' | 'invalido' | 'limite';
/** Which field the page should point the visitor back to. */
type Field = 'nome' | 'email';

const redirect = (location: string): Response =>
  new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });

const outcome = (kind: Outcome, field: Field = 'email'): Response =>
  redirect(kind === 'ok' ? `${CV_PAGE}?envio=ok#baixar` : `${CV_PAGE}?envio=${kind}#${field}`);

export const toCvDownload = (
  { name, email }: { name: string | null; email: string | null },
  now: Date,
): CvDownload => {
  const expiresAt = new Date(now);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + RETENTION_MONTHS);

  return { name, email, receivedAt: now.toISOString(), notified: false, expiresAt };
};

/**
 * The visitor came for the CV, and every path that is not their own mistake
 * (an invalid e-mail, too many tries) ends on the download. A database or mail
 * outage is my problem, so it never stands between them and the file.
 */
export const handleCvDownload = async (
  request: Request,
  { store, notifier, limiter, now }: CvDependencies,
): Promise<Response> => {
  if (request.method !== 'POST') return redirect(CV_PAGE);

  if (!limiter.check(clientIpOf(request.headers))) return outcome('limite');

  let fields: URLSearchParams;
  try {
    fields = new URLSearchParams(await readLimitedText(request));
  } catch {
    return outcome('invalido');
  }

  // A filled honeypot gets the same answer as a real visitor, so the trap is
  // not revealed; nothing is stored and nothing is sent.
  if ((fields.get(FORM_HONEYPOT) ?? '').trim() !== '') return outcome('ok');

  const name = (fields.get('nome') ?? '').trim();
  const email = (fields.get('email') ?? '').trim();

  // Skipping is skipping: no record, not even an anonymous one.
  if (name === '' && email === '') return outcome('ok');

  if (name.length > MAX_NAME) return outcome('invalido', 'nome');
  if (email !== '' && !emailSchema.safeParse(email).success) return outcome('invalido', 'email');

  const download = toCvDownload({ name: name || null, email: email || null }, now());

  let id: string;
  try {
    id = await store.save(download);
  } catch {
    console.warn('cv: could not store a download record');
    return outcome('ok');
  }

  try {
    await notifier.send(download, id);
    await store.markNotified(id);
  } catch {
    // The record survives with notified: false, so it can still be found.
  }

  return outcome('ok');
};

export const firestoreCvStore = (): CvStore => ({
  save: async (download) => {
    const reference = await getFirestoreClient().collection(CV_COLLECTION).add(download);
    return reference.id;
  },
  markNotified: async (id) => {
    await getFirestoreClient().collection(CV_COLLECTION).doc(id).update({ notified: true });
  },
});

export const renderCvNotification = (download: CvDownload, id: string): string =>
  [
    'Someone downloaded your CV from /curriculo and left their details.',
    '',
    `Name:     ${download.name ?? 'not given'}`,
    `E-mail:   ${download.email ?? 'not given'}`,
    `Received: ${download.receivedAt}`,
    `Record:   ${id}`,
    '',
  ].join('\n');

/** Same Resend account and addresses as the contact form (HireConfig). */
export const resendCvNotifier = (config: HireConfig): CvNotifier => {
  const client = new Resend(config.apiKey);

  return {
    send: async (download, id) => {
      const { error } = await client.emails.send({
        from: config.notifyFrom,
        to: config.notifyTo,
        subject: `CV downloaded by ${download.name ?? download.email}`,
        text: renderCvNotification(download, id),
      });

      // The SDK reports failure in the payload rather than by throwing.
      if (error) throw new Error(`Mail provider rejected the message: ${error.name}`);
    },
  };
};
