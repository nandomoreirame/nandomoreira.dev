import { timingSafeEqual } from 'node:crypto';
import { SELF_COOKIE, SELF_VALUE } from './recorder';

const sameToken = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

const SITE_DOMAIN = 'nandomoreira.dev';

/**
 * Cookie domain for the self mark: the site and every subdomain (the sales
 * landing at contrate.nandomoreira.dev), so one visit to /eu covers them all.
 * Any other host (the *.hosted.app backend, localhost) keeps a host-only cookie.
 */
export const cookieDomainFor = (hostname: string): string | undefined =>
  hostname === SITE_DOMAIN || hostname.endsWith(`.${SITE_DOMAIN}`) ? SITE_DOMAIN : undefined;

/**
 * Marks the author's own browser so his visits are not counted (REQ-008). A
 * wrong token looks exactly like a route that does not exist. `hostname` is
 * the validated public host (Astro's `url`): behind Firebase Hosting the raw
 * request URL can carry the backend's own host.
 */
export const handleSelf = (
  request: Request,
  selfToken: string | null,
  hostname: string = new URL(request.url).hostname,
): Response => {
  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (request.method !== 'GET' || !selfToken || !sameToken(token, selfToken)) return notFound();

  const domain = cookieDomainFor(hostname);

  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'cache-control': 'no-store',
      // The token is in this URL; the next page must not send it on as a referer.
      'referrer-policy': 'no-referrer',
      'set-cookie': `${SELF_COOKIE}=${SELF_VALUE}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`,
    },
  });
};
