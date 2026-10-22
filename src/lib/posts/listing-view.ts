import { BodyTimeoutError, BodyTooLargeError, readLimitedText } from '../hire/read-body';
import { parsePage } from './paginate';

/**
 * The /posts listing has two views. The list is the default. The choice lives
 * in an HttpOnly cookie, never in the query: `/posts` with no parameters still
 * renders the grid when the browser sends `listing-view=grid`.
 */
export const LISTING_VIEW_COOKIE = 'listing-view';

/** A year. The choice is a preference, so it outlives the browser session. */
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export type ListingView = 'list' | 'grid';

/** Only the exact cookie value `grid` leaves the list. Anything else is the list. */
export const parseListingView = (raw: string | null | undefined): ListingView => (raw === 'grid' ? 'grid' : 'list');

/** Page 1 is `/posts` itself, never `?pagina=1`. The view is not part of the URL. */
export const listingHref = (page: number): string => (page > 1 ? `/posts?pagina=${page}` : '/posts');

export const listingViewSetCookie = (view: ListingView, secure: boolean): string => {
  const parts = [
    `${LISTING_VIEW_COOKIE}=${view}`,
    'Path=/posts',
    `Max-Age=${YEAR_SECONDS}`,
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');

  return parts.join('; ');
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
      'set-cookie': listingViewSetCookie(view, url.protocol === 'https:'),
    },
  });
};
