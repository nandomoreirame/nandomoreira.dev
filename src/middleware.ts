import { defineMiddleware } from 'astro:middleware';
import { measureRequest } from './lib/analytics/measure';
import { recorder } from './lib/analytics/runtime';
import { handleListingView } from './lib/posts/listing-view';
import { rewriteTarget, salesRouting } from './lib/sales/host';
import { robotsTagFor } from './lib/seo/backend-host';

export const onRequest = defineMiddleware(async (context, next) => {
  // The listing view is a preference, not a page. The form posts here so the
  // address bar stays /posts; the origin check already ran ahead of this.
  if (context.request.method === 'POST' && context.url.pathname === '/posts') {
    return handleListingView(context.request, context.url);
  }

  // Dev and staging always; production once SALES_HOST_LIVE
  // (docs/runbooks/sales-subdomain.md).
  const sales = salesRouting(context.url);
  if (sales && 'redirect' in sales) {
    return new Response(null, { status: 301, headers: { location: sales.redirect } });
  }

  const response = await (sales ? next(rewriteTarget(sales.rewrite, context.url)) : next());

  await measureRequest(recorder, {
    request: context.request,
    url: context.url,
    isPrerendered: context.isPrerendered,
    response,
    rewrite: sales && 'rewrite' in sales ? sales.rewrite : undefined,
  });

  const tag = robotsTagFor(context.url.hostname);
  if (!tag) return response;

  // Redirect responses carry immutable headers; copy them instead of failing.
  const headers = new Headers(response.headers);
  headers.set('x-robots-tag', tag);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
});
