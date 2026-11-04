import type { APIRoute } from 'astro';
import { readHireConfig } from '../../../lib/hire/config';
import { resendThankYou } from '../../../lib/mail/thank-you';
import { confirmSubscription } from '../../../lib/newsletter/confirm';
import { confirmedBy } from '../../../lib/newsletter/handler';
import { resendSubscriberNotifier } from '../../../lib/newsletter/mail';
import { firestoreConfirmStore } from '../../../lib/newsletter/store';

export const prerender = false;

/** Read at module load so a missing secret fails at boot, like /api/subscribe. */
const config = readHireConfig(process.env);
const notify = resendSubscriberNotifier(config);
const thankYou = resendThankYou(config);

const REDIRECT = '/posts?assinatura=ok#novidades';

/**
 * Valid and invalid tokens redirect to the same place. The difference would
 * tell a probe whether an address is waiting for confirmation (REQ-003).
 */
export const GET: APIRoute = async ({ url }) => {
  const token = url.searchParams.get('token') ?? '';

  try {
    const email = await confirmSubscription(token, new Date(), firestoreConfirmStore());
    if (email) {
      try {
        await confirmedBy({ email, notify, thankYou });
      } catch {
        console.warn('newsletter: confirmation follow-up could not be sent');
      }
    }
  } catch {
    console.warn('newsletter: confirmation could not be stored');
  }

  return new Response(null, {
    status: 303,
    headers: { location: REDIRECT, 'cache-control': 'no-store' },
  });
};
