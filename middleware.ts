import { NextResponse, type NextRequest } from 'next/server'
import { env } from './env'

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|images|icons|robots.txt|[\\w-]+\\.\\w+).*)',
  ],
}

export async function middleware(request: NextRequest) {
  if (!!env.IS_OFFLINE) {
    return NextResponse.rewrite(new URL(`/offline`, request.url))
  }

  // Get hostname of request (e.g. demo.vercel.pub, demo.localhost:3000)
  let hostname = request.headers
    .get('host')!
    .replace('.localhost:3000', `.${env.NEXT_PUBLIC_ROOT_DOMAIN}`)

  // special case for Vercel preview deployment URLs
  if (
    hostname.includes('---') &&
    hostname.endsWith(`.${process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_SUFFIX}`)
  ) {
    hostname = `${hostname.split('---')[0]}.${env.NEXT_PUBLIC_ROOT_DOMAIN}`
  }

  let baseFolder = '/site'

  if (request.nextUrl.pathname.includes('/opengraph-image')) {
    baseFolder = '/og'
  } else if (`links.${env.NEXT_PUBLIC_ROOT_DOMAIN}` === hostname) {
    baseFolder = '/links'
  }

  const searchParams = request.nextUrl.searchParams.toString()
  const path = `${request.nextUrl.pathname}${
    searchParams.length > 0 ? `?${searchParams}` : ''
  }`

  const headers = new Headers(request.headers)
  headers.set('x-current-path', request.nextUrl.pathname)

  return NextResponse.rewrite(
    new URL(`${baseFolder}${path === '/' ? '' : path}`, request.url),
    { headers },
  )
}
