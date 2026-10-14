/**
 * The App Hosting backend answers the whole site on its own domain. The
 * canonical already points at nandomoreira.dev; this makes it an order for the
 * pages rendered on request (SEO audit 2026-10-13, item 3). Matched narrowly on
 * purpose: a wrong match here would de-index the real site.
 */
export const robotsTagFor = (hostname: string): 'noindex' | undefined =>
  hostname.endsWith('.hosted.app') ? 'noindex' : undefined;
