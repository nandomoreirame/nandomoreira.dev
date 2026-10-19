import { Resend } from 'resend';
import type { Recorder } from '../analytics/recorder';
import { z } from 'zod';
import type { HireConfig } from '../hire/config';
import { getFirestoreClient } from '../hire/firestore';
import { FORM_HONEYPOT } from '../hire/form';
import { type Limiter, clientIpOf } from '../hire/rate-limit';
import { readLimitedText } from '../hire/read-body';

import { CV_PAGE } from './paths';

export { CV_PAGE, CV_PDF_PATH } from './paths';

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
 * Every field is optional; a record exists only when at least one was given.
 */
export interface CvDownload {
  name: string | null;
  company: string | null;
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
  send: (download: CvDownload, id: string, journey?: string) => Promise<void>;
}

export interface CvDependencies {
  store: CvStore;
  notifier: CvNotifier;
  limiter: Limiter;
  now: () => Date;
  /** Optional so tests and a site without the analytics secret behave as before. */
  analytics?: Pick<Recorder, 'record' | 'journey'>;
}

const RETENTION_MONTHS = 12;

const emailSchema = z.email().max(254);
const MAX_NAME = 200;
const MAX_COMPANY = 200;

/** Where the form lands; the page reads `envio`. */
type Outcome = 'ok' | 'invalido' | 'limite';
/** Which field the page should point the visitor back to. */
type Field = 'nome' | 'empresa' | 'email';

const redirect = (location: string): Response =>
  new Response(null, { status: 303, headers: { location, 'cache-control': 'no-store' } });

const outcome = (kind: Outcome, field: Field = 'email'): Response =>
  redirect(kind === 'ok' ? `${CV_PAGE}?envio=ok#baixar` : `${CV_PAGE}?envio=${kind}#${field}`);

export const toCvDownload = (
  { name, company, email }: { name: string | null; company: string | null; email: string | null },
  now: Date,
): CvDownload => {
  const expiresAt = new Date(now);
  expiresAt.setUTCMonth(expiresAt.getUTCMonth() + RETENTION_MONTHS);

  return { name, company, email, receivedAt: now.toISOString(), notified: false, expiresAt };
};

/**
 * The visitor came for the CV, and every path that is not their own mistake
 * (an invalid e-mail, too many tries) ends on the download. A database or mail
 * outage is my problem, so it never stands between them and the file.
 */
export const handleCvDownload = async (
  request: Request,
  { store, notifier, limiter, now, analytics }: CvDependencies,
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
  const company = (fields.get('empresa') ?? '').trim();
  const email = (fields.get('email') ?? '').trim();

  // Nothing typed, nothing stored here (the download itself counts in /go).
  if (name === '' && company === '' && email === '') return outcome('ok');

  if (name.length > MAX_NAME) return outcome('invalido', 'nome');
  if (company.length > MAX_COMPANY) return outcome('invalido', 'empresa');
  if (email !== '' && !emailSchema.safeParse(email).success) return outcome('invalido', 'email');

  const download = toCvDownload({ name: name || null, company: company || null, email: email || null }, now());

  let id: string;
  try {
    id = await store.save(download);
  } catch {
    console.warn('cv: could not store a download record');
    return outcome('ok');
  }

  let journey: string | undefined;
  if (analytics) {
    // Measuring never costs the lead (REQ-006, REQ-012): the record is already
    // stored, so an analytics failure here must not turn into an error the
    // caller would retry, duplicating it.
    try {
      await analytics.record(request, {
        kind: 'conversion',
        path: '/api/cv',
        source: 'api',
        referrer: request.headers.get('referer'),
        conversion: { type: 'cv', refId: id },
      });
      journey = await analytics.journey(request);
    } catch {
      journey = undefined;
    }
  }

  try {
    await (journey ? notifier.send(download, id, journey) : notifier.send(download, id));
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

export const renderCvNotification = (download: CvDownload, id: string, journey?: string): string =>
  [
    'Someone downloaded your CV from /curriculo and left their details.',
    '',
    `Name:     ${download.name ?? 'not given'}`,
    `Company:  ${download.company ?? 'not given'}`,
    `E-mail:   ${download.email ?? 'not given'}`,
    `Received: ${download.receivedAt}`,
    `Record:   ${id}`,
    '',
    ...(journey ? [journey, ''] : []),
  ].join('\n');

/** Same Resend account and addresses as the contact form (HireConfig). */
export const resendCvNotifier = (config: HireConfig): CvNotifier => {
  const client = new Resend(config.apiKey);

  return {
    send: async (download, id, journey) => {
      const { error } = await client.emails.send({
        from: config.notifyFrom,
        to: config.notifyTo,
        subject: `CV downloaded by ${download.name ?? download.company ?? download.email}`,
        text: renderCvNotification(download, id, journey),
      });

      // The SDK reports failure in the payload rather than by throwing.
      if (error) throw new Error(`Mail provider rejected the message: ${error.name}`);
    },
  };
};
