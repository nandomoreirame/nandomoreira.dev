import '@/styles/site.css'

import { env } from '@/env'
import { getDomain } from '@/lib'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, web, designer, saas, micro-saas, tecnologia, marketing, tech',
  openGraph: {
    url: getDomain(),
    siteName: 'nandomoreira.dev',
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {children}
      {env.NODE_ENV === 'production' && env.GA4_SITE_ID && (
        <GoogleAnalytics gaId={env.GA4_SITE_ID} />
      )}
    </>
  )
}
