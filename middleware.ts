import { NextResponse, type NextRequest } from 'next/server'
import { env } from './env'

const redirects = [
  { source: '/about', destination: '/sobre' },
  { source: '/site', destination: '/' },
  { source: '/now', destination: '/' },
  { source: '/contact', destination: '/contato' },
  { source: '/experiments', destination: '/lab' },
]

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
  const [redir] = redirects.filter(({ source }) => {
    return request.nextUrl.pathname.startsWith(source)
  })

  if (redir && redir.destination) {
    const sourcePath = request.nextUrl.pathname.replace(redir.source, '')
    const destinationUrl = `${redir.destination}${sourcePath}`.replaceAll(
      '//',
      '/',
    )
    return NextResponse.redirect(new URL(destinationUrl, request.url))
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
