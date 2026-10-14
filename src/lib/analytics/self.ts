import { timingSafeEqual } from 'node:crypto';
import { SELF_COOKIE } from './recorder';

const sameToken = (given: string, expected: string): boolean => {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
};

const notFound = (): Response =>
  new Response('Not found', { status: 404, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });

/**
 * Marks the author's own browser so his visits are not counted (REQ-008). A
 * wrong token looks exactly like a route that does not exist.
 */
export const handleSelf = (request: Request, selfToken: string | null): Response => {
  const token = new URL(request.url).searchParams.get('token') ?? '';

  if (request.method !== 'GET' || !selfToken || !sameToken(token, selfToken)) return notFound();

  return new Response(null, {
    status: 303,
    headers: {
      location: '/',
      'cache-control': 'no-store',
      // The token is in this URL; the next page must not send it on as a referer.
      'referrer-policy': 'no-referrer',
      'set-cookie': `${SELF_COOKIE}=1; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
    },
  });
};
