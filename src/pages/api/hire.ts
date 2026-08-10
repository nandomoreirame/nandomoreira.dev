import type { APIRoute } from 'astro';
import { readHireConfig } from '../../lib/hire/config';
import { handleHire } from '../../lib/hire/handler';
import { resendNotifier } from '../../lib/hire/notify';
import { createLimiter } from '../../lib/hire/rate-limit';
import { firestoreStore } from '../../lib/hire/store';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance. See rate-limit.ts on the bounds. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

/**
 * Read once at module load so a missing secret fails at boot rather than on the
 * first briefing, which is the failure nobody notices (REQ-010).
 */
const config = readHireConfig(process.env);

const dependencies = {
  store: firestoreStore(),
  notifier: resendNotifier(config),
  limiter,
  now: () => new Date(),
};

export const ALL: APIRoute = ({ request }) => handleHire(request, dependencies);
