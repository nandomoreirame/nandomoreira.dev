import type { APIRoute } from 'astro';
import { recorder } from '../../lib/analytics/runtime';
import { readHireConfig } from '../../lib/hire/config';
import { handleHire } from '../../lib/hire/handler';
import { resendNotifier } from '../../lib/hire/notify';
import { createLimiter } from '../../lib/hire/rate-limit';
import { firestoreStore } from '../../lib/hire/store';
import { resendThankYou } from '../../lib/mail/thank-you';
import { allowHourly, firestoreHourlyStore } from '../../lib/security/hourly-limit';
import { originsFromEnv } from '../../lib/security/origin';
import { turnstileConfigOf, verifyTurnstile } from '../../lib/security/turnstile';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance. See rate-limit.ts on the bounds. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

/**
 * Read once at module load so a missing secret fails at boot rather than on the
 * first briefing, which is the failure nobody notices (REQ-010).
 */
const config = readHireConfig(process.env);

/** Both keys or neither, checked at boot, same as /api/subscribe. */
const turnstileSecret = turnstileConfigOf(process.env).secret;
const hourlyStore = firestoreHourlyStore();

const dependencies = {
  store: firestoreStore(),
  notifier: resendNotifier(config),
  thankYou: resendThankYou(config),
  limiter,
  now: () => new Date(),
  analytics: recorder,
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

export const ALL: APIRoute = ({ request }) => handleHire(request, dependencies);
