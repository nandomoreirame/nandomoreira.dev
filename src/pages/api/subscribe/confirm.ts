import type { APIRoute } from 'astro';
import { readHireConfig } from '../../../lib/hire/config';
import { resendThankYou } from '../../../lib/mail/thank-you';
import { confirmedBy } from '../../../lib/newsletter/handler';
import { handleConfirm } from '../../../lib/newsletter/confirm-page';
import { resendSubscriberNotifier } from '../../../lib/newsletter/mail';
import { firestoreConfirmStore } from '../../../lib/newsletter/store';

export const prerender = false;

/** Read at module load so a missing secret fails at boot, like /api/subscribe. */
const config = readHireConfig(process.env);
const notify = resendSubscriberNotifier(config);
const thankYou = resendThankYou(config);

export const ALL: APIRoute = ({ request }) =>
  handleConfirm(request, {
    store: firestoreConfirmStore(),
    now: () => new Date(),
    onConfirmed: email => confirmedBy({ email, notify, thankYou }),
  });
