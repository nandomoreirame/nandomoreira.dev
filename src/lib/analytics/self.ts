import { timingSafeEqual } from 'node:crypto';
import {
  cookieDomainFor,
  parseSession,
  serializeSession,
  sessionSetCookie,
  sessionValueFrom,
} from '../http/session-cookie';

export { cookieDomainFor };

const sameToken = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

/**
 * Marks the author's own browser so his visits are not counted (REQ-008). A
 * wrong token looks exactly like a route that does not exist. `hostname` is
 * the validated public host (Astro's `url`): behind Firebase Hosting the raw
 * request URL can carry the backend's own host. A grid choice already stored
 * in `__session` stays there.
 */
export const handleSelf = (
  request: Request,
  selfToken: string | null,
  hostname: string = new URL(request.url).hostname,
): Response => {
  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (request.method !== 'GET' || !selfToken || !sameToken(token, selfToken)) return notFound();

  const domain = cookieDomainFor(hostname);
  const current = parseSession(sessionValueFrom(request.headers.get('cookie')));

  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'cache-control': 'no-store',
      // The token is in this URL; the next page must not send it on as a referer.
      'referrer-policy': 'no-referrer',
      'set-cookie': sessionSetCookie(serializeSession({ self: true, view: current.view }), { secure: true, domain }),
    },
  });
};
