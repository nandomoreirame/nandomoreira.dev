import { env } from '@/env'
import { getDomain } from '@/lib'
import { MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default function robots(): MetadataRoute.Robots {
  const headerList = headers()
  const subdomain = headerList
    .get('host')!
    .replace(`${env.NEXT_PUBLIC_ROOT_DOMAIN}`, '')
    .replace('.', '')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // disallow: '/private/',
    },
    sitemap: `${getDomain(subdomain)}/sitemap.xml`,
  }
}
