import type { APIRoute } from 'astro';
import { analyticsConfig } from '../lib/analytics/runtime';
import { handleSelf } from '../lib/analytics/self';

export const prerender = false;

export const ALL: APIRoute = ({ request, url }) => handleSelf(request, analyticsConfig.selfToken, url.hostname);
