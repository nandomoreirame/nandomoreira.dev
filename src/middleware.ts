import { defineMiddleware } from 'astro:middleware';
import { measureRequest } from './lib/analytics/measure';
import { recorder } from './lib/analytics/runtime';
import { salesRouting } from './lib/sales/host';
import { robotsTagFor } from './lib/seo/backend-host';

export const onRequest = defineMiddleware(async (context, next) => {
  // Off until SALES_HOST_LIVE (docs/runbooks/sales-subdomain.md).
  const sales = salesRouting(context.url);
  if (sales && 'redirect' in sales) {
    return new Response(null, { status: 301, headers: { location: sales.redirect } });
  }

  const response = await (sales ? next(sales.rewrite) : next());

  await measureRequest(recorder, {
    request: context.request,
    url: context.url,
    isPrerendered: context.isPrerendered,
    response,
  });

  const tag = robotsTagFor(context.url.hostname);
  if (!tag) return response;

  // Redirect responses carry immutable headers; copy them instead of failing.
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', tag);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
