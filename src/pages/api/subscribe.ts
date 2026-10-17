import type { APIRoute } from 'astro';
import { createLimiter } from '../../lib/hire/rate-limit';
import { handleSubscribe } from '../../lib/newsletter/handler';
import { firestoreSubscriberStore } from '../../lib/newsletter/store';

export const prerender = false;

/** 5 requests per 10 minutes per IP, per instance, like /api/hire. */
const limiter = createLimiter({ max: 5, windowMs: 10 * 60 * 1000 });

const dependencies = { store: firestoreSubscriberStore(), limiter, now: () => new Date() };

export const ALL: APIRoute = ({ request }) => handleSubscribe(request, dependencies);
