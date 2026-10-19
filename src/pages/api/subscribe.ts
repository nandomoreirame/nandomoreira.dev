import type { APIRoute } from 'astro';
import { readHireConfig } from '../../lib/hire/config';
import { createLimiter } from '../../lib/hire/rate-limit';
import { resendThankYou } from '../../lib/mail/thank-you';
import { handleSubscribe } from '../../lib/newsletter/handler';
import { resendSubscriberNotifier } from '../../lib/newsletter/mail';
import { firestoreSubscriberStore } from '../../lib/newsletter/store';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance, like /api/hire. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

/** Read at module load so a missing secret fails at boot, like /api/hire and /api/cv. */
const config = readHireConfig(process.env);

const dependencies = {
  store: firestoreSubscriberStore(),
  limiter,
  now: () => new Date(),
  notify: resendSubscriberNotifier(config),
  thankYou: resendThankYou(config),
};

export const ALL: APIRoute = ({ request }) => handleSubscribe(request, dependencies);
