import { defineMiddleware } from 'astro:middleware';
import { robotsTagFor } from './lib/seo/backend-host';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const tag = robotsTagFor(context.url.hostname);
  if (!tag) return response;

  // Redirect responses carry immutable headers; copy them instead of failing.
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', tag);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
