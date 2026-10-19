import type { APIRoute } from 'astro';
import { recorder } from '../../lib/analytics/runtime';
import { firestoreCvStore, handleCvDownload, resendCvNotifier } from '../../lib/cv/download';
import { readHireConfig } from '../../lib/hire/config';
import { createLimiter } from '../../lib/hire/rate-limit';
import { resendThankYou } from '../../lib/mail/thank-you';

export const prerender = false;

/** 5 e-mails per 10 minutes per IP, per instance, like the contact form. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

/** Read at module load so a missing secret fails at boot, not on the first download. */
const config = readHireConfig(process.env);

const dependencies = {
  store: firestoreCvStore(),
  notifier: resendCvNotifier(config),
  thankYou: resendThankYou(config),
  limiter,
  now: () => new Date(),
  analytics: recorder,
};

export const ALL: APIRoute = ({ request }) => handleCvDownload(request, dependencies);
