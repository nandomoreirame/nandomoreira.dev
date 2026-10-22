import { BodyTimeoutError, BodyTooLargeError, readLimitedText } from '../hire/read-body';
import {
  cookieDomainFor,
  parseSession,
  serializeSession,
  sessionSetCookie,
  sessionValueFrom,
} from '../http/session-cookie';
import { parsePage } from './paginate';

/**
 * The /posts listing has two views. The list is the default. The choice lives
 * in the `__session` cookie, never in the query: App Hosting drops every other
 * cookie name, so `/posts` with no parameters still renders the grid when the
 * browser sends `__session=grid` or `__session=self.grid`.
 */
export type ListingView = 'list' | 'grid';

/** `grid` and `self.grid` are the grid. The author mark alone stays on the list. */
export const parseListingView = (raw: string | null | undefined): ListingView => parseSession(raw).view;

/** Page 1 is `/posts` itself, never `?pagina=1`. The view is not part of the URL. */
export const listingHref = (page: number): string => (page > 1 ? `/posts?pagina=${page}` : '/posts');

export const listingViewSetCookie = (
  view: ListingView,
  options: { secure: boolean; current?: string | null; domain?: string },
): string => {
  const current = parseSession(options.current);
  return sessionSetCookie(serializeSession({ self: current.self, view }), {
    secure: options.secure,
    domain: options.domain,
  });
};

const formBody = async (request: Request): Promise<URLSearchParams | undefined> => {
  const type = request.headers.get('content-type') ?? '';
  if (!type.startsWith('application/x-www-form-urlencoded')) return undefined;

  try {
    return new URLSearchParams(await readLimitedText(request));
  } catch (error) {
    if (error instanceof BodyTooLargeError || error instanceof BodyTimeoutError) return undefined;
    throw error;
  }
};

/**
 * POST /posts saves the other view and redirects back to the same page.
 * `secure` follows the public URL (https in production, http on the dev server).
 */
export const handleListingView = async (request: Request, url = new URL(request.url)): Promise<Response> => {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { allow: 'POST' } });
  }

  const params = await formBody(request);
  const raw = params?.get('visao');
  const view = raw === 'grade' ? 'grid' : raw === 'lista' ? 'list' : null;
  if (!params || !view) return new Response(null, { status: 400 });

  return new Response(null, {
    status: 303,
    headers: {
      location: listingHref(parsePage(url.searchParams.get('pagina'))),
      'cache-control': 'no-store',
      'set-cookie': listingViewSetCookie(view, {
        secure: url.protocol === 'https:',
        current: sessionValueFrom(request.headers.get('cookie')),
        domain: cookieDomainFor(url.hostname),
      }),
    },
  });
};
