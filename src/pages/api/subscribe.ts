import type { APIRoute } from 'astro';
import { readHireConfig } from '../../lib/hire/config';
import { createLimiter } from '../../lib/hire/rate-limit';
import { resendThankYou } from '../../lib/mail/thank-you';
import { handleSubscribe } from '../../lib/newsletter/handler';
import { resendConfirmationSender, resendSubscriberNotifier } from '../../lib/newsletter/mail';
import { firestoreSubscriberStore } from '../../lib/newsletter/store';
import { allowHourly, firestoreHourlyStore } from '../../lib/security/hourly-limit';
import { originsFromEnv } from '../../lib/security/origin';
import { turnstileConfigOf, verifyTurnstile } from '../../lib/security/turnstile';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance, like /api/hire. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

/** Read at module load so a missing secret fails at boot, like /api/hire and /api/cv. */
const config = readHireConfig(process.env);

/** Both keys or neither, checked at boot. Neither leaves the captcha off, which the route test records. */
const turnstile = turnstileConfigOf(process.env);
const turnstileSecret = turnstile.secret;
const hourlyStore = firestoreHourlyStore();

const dependencies = {
  store: firestoreSubscriberStore(),
  limiter,
  now: () => new Date(),
  notify: resendSubscriberNotifier(config),
  thankYou: resendThankYou(config),
  sendConfirmation: resendConfirmationSender(config),
  captcha: {
    required: turnstileSecret !== '',
    verify: (token: string, remoteIp: string) =>
      verifyTurnstile(token, { secret: turnstileSecret, fetch: globalThis.fetch, remoteIp }),
  },
  origins: originsFromEnv(process.env),
  hourly: {
    allow: (ip: string, now: Date) => allowHourly(ip, now, { store: hourlyStore, max: 10 }),
  },
};

export const ALL: APIRoute = ({ request }) => handleSubscribe(request, dependencies);
