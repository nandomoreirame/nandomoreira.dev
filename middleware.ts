import { NextResponse, type NextRequest } from 'next/server';

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

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  let hostname = req.headers
    .get('host')!
    .replace('.localhost:3000', `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`);

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes('---') &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split('---')[0]}.${
      process.env.NEXT_PUBLIC_ROOT_DOMAIN
    }`;
  }

  const searchParams = req.nextUrl.searchParams.toString();
  const path = `${url.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`;

  // rewrite root application to `/api` folder
  if (
    hostname === 'api.localhost:3000' ||
    hostname === `api.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  ) {
    return NextResponse.rewrite(
      new URL(`/api${path === '/' ? '' : path}`, req.url),
    );
  }

  // rewrite root application to `/blog` folder
  if (
    hostname === 'blog.localhost:3000' ||
    hostname === `blog.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  ) {
    return NextResponse.rewrite(
      new URL(`/blog${path === '/' ? '' : path}`, req.url),
    );
  }

  // rewrite root application to `/lab` folder
  if (
    hostname === 'lab.localhost:3000' ||
    hostname === `lab.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`
  ) {
    return NextResponse.rewrite(
      new URL(`/lab${path === '/' ? '' : path}`, req.url),
    );
  }

  // rewrite everything else to `/[domain]/[slug] dynamic route
  return NextResponse.rewrite(
    new URL(`/site${path === '/' ? '' : path}`, req.url),
  );
}
