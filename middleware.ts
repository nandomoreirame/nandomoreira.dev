import { NextResponse, type NextRequest } from 'next/server';
import { env } from './environments';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export async function middleware(request: NextRequest) {
  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  let hostname = request.headers
    .get('host')!
    .replace('.localhost:3000', `.${env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes('---') &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split('---')[0]}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`;
  }

  let baseFolder = '/site';

  switch (hostname) {
    // rewrite root application to `/api` folder
    case `api.${env.NEXT_PUBLIC_ROOT_DOMAIN}`:
      baseFolder = '/api';
      break;

    // rewrite root application to `/blog` folder
    case `blog.${env.NEXT_PUBLIC_ROOT_DOMAIN}`:
      baseFolder = '/blog';
      break;

    // rewrite root application to `/lab` folder
    case `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`:
      baseFolder = '/lab';
      break;
  }

  const searchParams = request.nextUrl.searchParams.toString();
  const path = `${request.nextUrl.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`;

  return NextResponse.rewrite(
    new URL(`${baseFolder}${path === '/' ? '' : path}`, request.url),
  );
}
