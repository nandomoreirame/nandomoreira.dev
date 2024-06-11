import { env } from '@/env'
import { getDomain } from '@/lib'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  keywords:
    'indie hacker, indie, hacker, desenvolvedor, developer, front-end, back-end, full-stack, web designer, web, designer, saas, micro-saas, tecnologia, marketing, tech',
  title: {
    template: '%s | Links do Nando',
    default: 'Links do Nando',
  },
  openGraph: {
    url: getDomain('blog'),
    siteName: `lab.${env.NEXT_PUBLIC_ROOT_DOMAIN}`,
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-12">
        {children}
      </div>
      {env.NODE_ENV === 'production' && env.GA4_LINKS_ID && (
        <GoogleAnalytics gaId={env.GA4_LINKS_ID} />
      )}
    </>
  )
}
